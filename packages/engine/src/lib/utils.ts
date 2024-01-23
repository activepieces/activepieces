import { readFile, writeFile } from 'node:fs/promises'

export const utils = {
    async parseJsonFile<T>(filePath: string): Promise<T> {
        try {
            const file = await readFile(filePath, 'utf-8')
            return JSON.parse(file)
        }
        catch (e) {
            throw Error((e as Error).message)
        }
    },

    async writeToJsonFile(filePath: string, obj: unknown): Promise<void> {
        const serializedObj = JSON.stringify(obj, (_key: string, value: unknown) => {
            if (value instanceof Map) {
                return Object.fromEntries(value)
            }
            else {
                return value
            }
        })

        await writeFile(filePath, serializedObj, 'utf-8')
    },

    tryParseJson(value: string): unknown {
        try {
            return JSON.parse(value)
        }
        catch (e) {
            return value
        }
    },
}
