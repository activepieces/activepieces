export const credentialPlaceholder = {
    build({ grantId, fieldIndex }: BuildPlaceholderParams): string {
        if (!Number.isInteger(fieldIndex) || fieldIndex < 0 || fieldIndex > MAX_FIELD_INDEX) {
            throw new Error(`credential placeholder field index out of range: ${fieldIndex}`)
        }
        return `${PREFIX}_${grantId}_${String(fieldIndex).padStart(FIELD_INDEX_DIGITS, '0')}`
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
const FIELD_INDEX_DIGITS = 3
const MAX_FIELD_INDEX = 10 ** FIELD_INDEX_DIGITS - 1
const PLACEHOLDER_SOURCE = `${PREFIX}_([0-9A-Za-z]{21})_(\\d{${FIELD_INDEX_DIGITS}})`

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
