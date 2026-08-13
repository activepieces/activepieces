const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

function isStorableText(value: string): boolean {
    return !CONTROL_CHARACTERS.test(value)
}

export const mcpOAuthValidation = {
    isStorableText,
    storableTextMessage: 'Control characters are not allowed',
}
