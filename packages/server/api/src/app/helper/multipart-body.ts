import { ApMultipartFile } from '@activepieces/core-utils'
import { Multipart } from '@fastify/multipart'

/**
 * Rebuilds the body shape that `@fastify/multipart`'s `attachFieldsToBody: 'keyValues'` used to
 * produce, for routes whose schema expects files as `ApMultipartFile` (piece archives, platform
 * logos, knowledge-base uploads). That option is no longer registered globally, because its
 * `preValidation` hook buffered every part of every request — including webhook file uploads,
 * which must stream to storage.
 *
 * Attach this per route instead, so only routes that genuinely need the whole file in memory buffer it.
 * Consuming every part up front also keeps the body order-independent: a field appended after the
 * file part is still found, which reading `part.fields` off `request.file()` cannot guarantee.
 */
export const attachMultipartFieldsToBody = async (request: MultipartRequest): Promise<void> => {
    if (!request.isMultipart()) {
        return
    }
    const body: Record<string, unknown> = {}
    for await (const part of request.parts()) {
        if (part.type === 'file') {
            // toBuffer() throws FST_REQ_FILE_TOO_LARGE (413) when the part exceeds limits.fileSize.
            const file: ApMultipartFile = {
                filename: part.filename,
                data: await part.toBuffer(),
                type: 'file',
                mimetype: part.mimetype,
            }
            body[part.fieldname] = file
        }
        else {
            body[part.fieldname] = part.value
        }
    }
    request.body = body
}

// Structural rather than FastifyRequest: a FastifyRequest parameter makes each route infer its
// ContextConfig from this hook instead of from its own `config`, which silently widens
// `request.principal` and collapses `request.projectId` to undefined (see types/fastify.d.ts).
type MultipartRequest = {
    isMultipart: () => boolean
    parts: () => AsyncIterableIterator<Multipart>
    body: unknown
}
