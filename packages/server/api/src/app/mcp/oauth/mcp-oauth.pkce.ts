import { createHash } from 'crypto'

function verifyS256Challenge(codeVerifier: string, codeChallenge: string): boolean {
    const hash = createHash('sha256').update(codeVerifier).digest()
    const computed = hash.toString('base64url')
    return computed === codeChallenge
}

export const mcpOAuthPkce = {
    verify(codeVerifier: string, codeChallenge: string, method: string): boolean {
        if (method !== 'S256') {
            return false
        }
        return verifyS256Challenge(codeVerifier, codeChallenge)
    },
}
