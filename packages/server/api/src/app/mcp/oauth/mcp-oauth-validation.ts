const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/

export const mcpOAuthValidation = {
    isStorableText(value: string): boolean {
        return !CONTROL_CHARACTERS.test(value)
    },
}

export const STORABLE_TEXT_MESSAGE = 'Control characters are not allowed'
