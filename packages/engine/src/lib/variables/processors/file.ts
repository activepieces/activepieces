import { ApFile } from '@activepieces/pieces-framework'
import { isNil, isString } from '@activepieces/shared'
import { handleUrlFile } from './common'
import isBase64 from 'is-base64'
import mime from 'mime-types'
import { ProcessorFn } from './types'

export const fileProcessor: ProcessorFn = async (_property, urlOrBase64) => {
    if (isNil(urlOrBase64) || !isString(urlOrBase64)) {
        return null
    }
    try {
        const file = handleBase64File(urlOrBase64)
        if (!isNil(file)) {
            return file
        }
        return await handleUrlFile(urlOrBase64)
    }
    catch (e) {
        console.error(e)
        return null
    }
}

function handleBase64File(propertyValue: string): ApFile | null {
    if (!isBase64(propertyValue, { allowMime: true })) {
        return null
    }
    const matches = propertyValue.match(/^data:([A-Za-z-+/]+);base64,(.+)$/) // example match: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD///+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4Ug9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC
    if (!matches || matches?.length !== 3) {
        return null
    }
    const base64 = matches[2]
    const extension = mime.extension(matches[1]) || 'bin'
    return new ApFile(
        `unknown.${extension}`,
        Buffer.from(base64, 'base64'),
        extension,
    )
}
