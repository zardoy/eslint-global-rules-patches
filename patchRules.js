const patchRulesCore = require('./patchRulesCore')

patchRulesCore((result, sourceText, fileName) => {
    const lines = sourceText.split('\n')
    return result.map((/** @type {ReportedMessage} */ message) => {
        if (message.message.startsWith('Unused eslint-disable directive')) {
            const line = lines[message.line - 1]
            if (message.fix && !line.includes(',') && line.trimStart().startsWith('//')) {
                message.fix.range[0] = getLineStartOffset(sourceText, message.line) - 1
                message.fix.range[1] = message.fix.range[0] + line.length + 1
            }
        }
        return message
    })
})

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
