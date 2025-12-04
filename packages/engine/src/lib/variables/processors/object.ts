import { isNil } from '@activepieces/shared'
import { ProcessorFn } from './types'
import { handleUrlFile } from './common'

export const objectProcessor: ProcessorFn = async (_property, value) => {
    if (isNil(value)) {
        return value
    }
    if (typeof value === 'string') {
        try {
            return await processObject(JSON.parse(value))
        }
        catch (e) {
            return undefined
        }
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return await processObject(value)
    }
    return undefined
}

async function processObject(object: any) {
    for (const key of Object.keys(object)) {
        if (typeof object[key] === 'string') {
            try {
                object[key] = await handleUrlFile(object[key])
            } catch (e) {
                // If not succesful, don't change the value. The string was not a valid file URL.
            }
        }
    }

    return object
}