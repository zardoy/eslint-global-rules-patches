//@ts-check

const path = require('path')
const needle = `${path.sep}node_modules${path.sep}eslint${path.sep}`

const getLinters = () => {
    const eslintPaths = new Set(
        Object.keys(require.cache)
            .filter(id => id.includes(needle))
            .map(id => id.slice(0, id.indexOf(needle) + needle.length)),
    )
    const linters = []

    for (const eslintPath of eslintPaths) {
        try {
            const linter = require(eslintPath).Linter

            if (linter) {
                linters.push(linter)
            }
        } catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND') {
                throw error
            }
        }
    }

    return linters
}

module.exports = patchRulesOfFn => {
    for (const Linter of getLinters()) {
        const verify0 = Linter.prototype._verifyWithoutProcessors
        Object.defineProperty(Linter.prototype, '_verifyWithoutProcessors', {
            value(textOrSourceCode, config, filenameOrOptions) {
                const result = verify0.call(this, textOrSourceCode, config, filenameOrOptions)
                console.log(result)
                if (typeof patchRulesOfFn === 'function')
                    return patchRulesOfFn(result, textOrSourceCode, typeof filenameOrOptions === 'object' ? filenameOrOptions.filename : filenameOrOptions)
                return result
            },
            writable: true,
            configurable: true,
        })
    }
}
