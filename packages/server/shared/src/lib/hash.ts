import * as crypto from 'crypto'

function hashObject(object: Record<string, unknown>) {
    const algorithm = 'sha256'
    const hash = crypto.createHash(algorithm)
    hash.update(JSON.stringify(object))
    return hash.digest('hex')
}

export const hashUtils = {
    hashObject,
}