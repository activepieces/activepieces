import { CHAT_ALLOWED_MIME_TYPES } from '@activepieces/shared'
import { UserContent } from 'ai'

const TEXT_MIME_TYPES = new Set<string>(
    CHAT_ALLOWED_MIME_TYPES.filter((m) => m.startsWith('text/') || m === 'application/json'),
)

const MAX_EXTRACTED_TEXT_LENGTH = 50_000

async function extractPdfText(base64Data: string): Promise<string> {
    const { extractText, getDocumentProxy } = await import('unpdf')
    const buffer = Buffer.from(base64Data, 'base64')
    const pdf = await getDocumentProxy(new Uint8Array(buffer))
    const { text } = await extractText(pdf, { mergePages: true })
    return text.length > MAX_EXTRACTED_TEXT_LENGTH
        ? text.slice(0, MAX_EXTRACTED_TEXT_LENGTH) + '\n[Content truncated due to length]'
        : text
}

function sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9 \-_.()]/g, '_').slice(0, 255)
}

async function buildUserContentWithFiles({ text, files }: {
    text: string
    files?: Array<{ name: string, mimeType: string, data: string }>
}): Promise<UserContent> {
    if (!files || files.length === 0) {
        return text
    }

    let userText = text

    for (const file of files) {
        const safeName = sanitizeFileName(file.name)
        if (TEXT_MIME_TYPES.has(file.mimeType)) {
            userText += `\n--- File: ${safeName} ---\n${Buffer.from(file.data, 'base64').toString('utf-8')}`
        }
        else if (file.mimeType === 'application/pdf') {
            const pdfText = await extractPdfText(file.data)
            userText += `\n--- File: ${safeName} ---\n${pdfText}`
        }
    }

    const imageFiles = files.filter((f) => f.mimeType.startsWith('image/'))
    if (imageFiles.length === 0) {
        return userText
    }

    return [
        { type: 'text' as const, text: userText },
        ...imageFiles.map((f) => ({ type: 'image' as const, image: f.data, mimeType: f.mimeType })),
    ]
}

export { buildUserContentWithFiles }
