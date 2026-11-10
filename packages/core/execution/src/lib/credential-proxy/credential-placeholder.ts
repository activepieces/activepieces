export const credentialPlaceholder = {
    build({ grantId, fieldIndex }: BuildPlaceholderParams): string {
        return `${PREFIX}_${grantId}_${fieldIndex}`
    },
    parse(text: string): CredentialPlaceholderRef[] {
        return [...text.matchAll(new RegExp(PLACEHOLDER_SOURCE, 'g'))].map((match) => ({
            placeholder: match[0],
            grantId: match[1],
            fieldIndex: Number(match[2]),
        }))
    },
    containsAny(text: string): boolean {
        return new RegExp(PLACEHOLDER_SOURCE).test(text)
    },
}

const PREFIX = 'apcred1'
const PLACEHOLDER_SOURCE = `${PREFIX}_([0-9A-Za-z]{21})_(\\d{1,2})`

export const CREDENTIAL_PLACEHOLDER_PATTERN = new RegExp(PLACEHOLDER_SOURCE, 'g')

export type CredentialPlaceholderRef = {
    placeholder: string
    grantId: string
    fieldIndex: number
}

type BuildPlaceholderParams = {
    grantId: string
    fieldIndex: number
}
