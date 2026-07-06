import { CHAT_ALLOWED_MIME_TYPES, FileCompression, FileType } from '@activepieces/shared'
import { UserContent } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../../file/file.service'

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

async function persistChatAttachments({ files, projectId, platformId, log }: {
    files: Array<{ name: string, mimeType: string, data: string }>
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<Array<{ fileId: string, name: string, mimeType: string }>> {
    return Promise.all(files.map(async (file) => {
        const buffer = Buffer.from(file.data, 'base64')
        const saved = await fileService(log).save({
            projectId,
            platformId,
            data: buffer,
            size: buffer.length,
            type: FileType.FLOW_STEP_FILE,
            fileName: sanitizeFileName(file.name),
            compression: FileCompression.NONE,
            metadata: { mimetype: file.mimeType },
        })
        return { fileId: saved.id, name: sanitizeFileName(file.name), mimeType: file.mimeType }
    }))
}

function buildAttachmentNote(refs: Array<{ fileId: string, name: string, mimeType: string }>): string {
    if (refs.length === 0) {
        return ''
    }
    const lines = refs.map((ref) => `- ${ref.name} → fileId \`${ref.fileId}\` (${ref.mimeType})`)
    return `\n\n[Attachments saved and available to ap_run_code via inputFileIds:\n${lines.join('\n')}]`
}

async function buildUserContentWithFiles({ text, files, attachmentNote }: {
    text: string
    files?: Array<{ name: string, mimeType: string, data: string }>
    attachmentNote?: string
}): Promise<UserContent> {
    if (!files || files.length === 0) {
        return text
    }

    let userText = text

    for (const file of files) {
        const safeName = sanitizeFileName(file.name)
        if (TEXT_MIME_TYPES.has(file.mimeType)) {
            const decoded = Buffer.from(file.data, 'base64').toString('utf-8')
            const content = decoded.length > MAX_EXTRACTED_TEXT_LENGTH
                ? decoded.slice(0, MAX_EXTRACTED_TEXT_LENGTH) + '\n[Content truncated due to length]'
                : decoded
            userText += `\n--- File: ${safeName} ---\n${content}`
        }
        else if (file.mimeType === 'application/pdf') {
            const pdfText = await extractPdfText(file.data)
            userText += `\n--- File: ${safeName} ---\n${pdfText}`
        }
    }

    if (attachmentNote) {
        userText += attachmentNote
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

export { buildUserContentWithFiles, persistChatAttachments, buildAttachmentNote }
