const patchRulesCore = require('./patchRulesCore')

const getRemoveLineRange = (sourceText, line) => {
    const start = getLineStartOffset(sourceText, line) - 1
    const end = sourceText.indexOf('\n', start + 1)
    return [start, end]
}

const removeHighlighted =
    (tryRemoveLine = true) =>
    (r, sourceText) => {
        const start = getOffset(sourceText, r.line, r.column)
        const end = getOffset(sourceText, r.endLine, r.endColumn)
        if (tryRemoveLine && r.line === r.endLine) {
            const lineText = (sourceText.slice(0, start) + sourceText.slice(end)).split('\n')[r.line - 1].trim()
            if (lineText === '' || lineText === ';') {
                return {
                    range: getRemoveLineRange(sourceText, r.line),
                    newText: '',
                }
            }
        }
        return {
            range: [start, end],
            newText: '',
        }
    }

const suggestionsToFixes = [['unicorn/prefer-code-point'], ['@typescript-eslint/no-unnecessary-type-constraint']]
const addFixes = []
const addSuggestions = [
    // ['@typescript-eslint/no-floating-promises', [[removeHighlighted(), 'Remove it why not']]]
]

patchRulesCore((/** @type {ReportedMessage[]} */ result, sourceText, fileName) => {
    const lines = sourceText.split('\n')
    return result.map(message => {
        if (message.message.startsWith('Unused eslint-disable directive')) {
            const line = lines[message.line - 1]
            if (message.fix && !line.includes(',') && line.trimStart().startsWith('//')) {
                message.fix.range = getRemoveLineRange(sourceText, message.line)
            }
        }
        const getFiltered = name => (name === '*' ? result : result.filter(m => m.ruleId === name))
        const applyFilter = (filter, arr) => arr.find(filter)
        for (const [name, filter] of suggestionsToFixes) {
            const interested = getFiltered(name)
            for (const r of interested) {
                if (!r.suggestions?.length) continue
                const suggestion = filter ? applyFilter(filter, r.suggestions) : r.suggestions[0]
                if (!suggestion) continue
                r.suggestions.splice(r.suggestions.indexOf(suggestion), 1)
                r.fix = suggestion.fix
            }
        }
        for (const [name, action] of addFixes) {
            const interested = getFiltered(name)
            for (const r of interested) {
                if (r.fix) continue
                r.fix = action(r, sourceText, fileName)
            }
        }
        for (const [name, actions] of addSuggestions) {
            const interested = getFiltered(name)
            for (const r of interested) {
                r.suggestions ??= []
                const suggestionsToAdd = actions
                    .map(([getFix, desc]) => {
                        const fix = getFix(r, sourceText, fileName)
                        if (!fix) return
                        return { fix, desc }
                    })
                    .filter(Boolean)
                r.suggestions.push(...suggestionsToAdd)
            }
        }
        return message
    })
})

// line column to offset
function getOffset(text, line, column) {
    let offset = 0
    for (let i = 0; i < line - 1; i++) {
        offset = text.indexOf('\n', offset) + 1
        if (text[offset - 2] === '\r') {
            offset++
        }
    }
    return offset + column - 1
}

// input: string, line number. output: number of characters before the line starts
function getLineStartOffset(text, line) {
    let offset = 0
    for (let i = 0; i < line - 1; i++) {
        offset = text.indexOf('\n', offset) + 1
        if (text[offset - 2] === '\r') {
            offset++
        }
    }
    return offset
}

// getLineStartOffset crlf aware
