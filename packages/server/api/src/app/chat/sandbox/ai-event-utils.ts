import { isObject, isString } from '@activepieces/shared'

function extractContentText(update: Record<string, unknown>): string | undefined {
    if (!isObject(update.content)) return undefined
    if (update.content.type !== 'text') return undefined
    return isString(update.content.text) ? update.content.text : undefined
}

function isHistoryReplayContent(text: string): boolean {
    return (text.includes('"jsonrpc"') && text.includes('"session/update"'))
        || text.includes('Previous session history is replayed below')
        || text.includes('[history truncated]')
}

function extractToolOutput(update: Record<string, unknown>): string | undefined {
    if (isString(update['rawOutput'])) return update['rawOutput']
    if (Array.isArray(update['content'])) {
        const parts: string[] = []
        for (const block of update['content']) {
            if (isObject(block) && block['type'] === 'text' && isString(block['text'])) {
                parts.push(block['text'])
            }
        }
        if (parts.length > 0) return parts.join('\n')
    }
    return undefined
}

export const chatEventUtils = {
    extractContentText,
    isHistoryReplayContent,
    extractToolOutput,
}
