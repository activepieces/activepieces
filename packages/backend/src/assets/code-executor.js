const handler = require('./index');
const { readFile, writeFile } = require('node:fs/promises');

const readInput = async () => {
    const serializedInput = await readFile('_input.txt', { encoding: 'utf8' })
    return JSON.parse(serializedInput);
}

const writeOutput = async (output) => {
    const serializedOutput = output === undefined ? 'undefined': JSON.stringify(output)
    await writeFile('output.json', serializedOutput)
}

const main = async () => {
    try {
        const input = await readInput()
        const response = await handler.code(input);

        const output = {
            status: 'OK',
            response: response
        }

        await writeOutput(output)
    }
    catch (e) {
        // fill _standardError.txt
        console.error(e)

        const output = {
            status: 'ERROR'
        }

        await writeOutput(output)
    }
}

main();
