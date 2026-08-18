import { buffer as readableToBuffer } from 'node:stream/consumers'
import { isNil } from '@activepieces/core-utils'
import { ApFile, ApStreamingFile, PieceAuth, Property } from '@activepieces/pieces-framework'
import { materializeFile, readFileSource } from '../../src/lib/variables/processors/file'
import { propsProcessor } from '../../src/lib/variables/props-processor'

const HELLO_TXT_DATA_URL = 'data:text/plain;base64,aGVsbG8='
const FILE_URL = 'https://example.com/report.csv'

async function processFile(input: unknown, { streaming = true, required = true } = {}): Promise<{ processedInput: Record<string, unknown>, errors: Record<string, unknown> }> {
    const props = {
        file: Property.File({ displayName: 'File', required, streaming }),
    }
    return propsProcessor.applyProcessorsAndValidators(
        { file: input },
        props,
        PieceAuth.None(),
        false,
        {},
    )
}

async function materializeProcessed(input: unknown, { streaming = true, required = true } = {}): Promise<ApStreamingFile | ApFile | null> {
    const { processedInput } = await processFile(input, { streaming, required })
    const source = readFileSource(processedInput.file)
    if (isNil(source)) {
        throw new Error('Expected a file source marker')
    }
    return materializeFile(source)
}

async function resolveStreamingFile(input: unknown, required = true): Promise<ApStreamingFile> {
    const file = await materializeProcessed(input, { required })
    if (isNil(file) || !('body' in file)) {
        throw new Error('Expected a streaming file')
    }
    return file
}

describe('File Processor', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('keeps the file unresolved in the engine process, carrying only its source', async () => {
        const fetchSpy = vi.fn()
        vi.stubGlobal('fetch', fetchSpy)

        const { processedInput, errors } = await processFile(FILE_URL)

        expect(errors).toEqual({})
        expect(fetchSpy).not.toHaveBeenCalled()
        expect(readFileSource(processedInput.file)).toEqual({ source: FILE_URL, streaming: true })
    })

    it('resolves a streaming URL input to a lazy body, deriving size and name from headers', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('hello world', {
            headers: { 'content-type': 'text/csv', 'content-length': '11' },
        })))

        const file = await resolveStreamingFile(FILE_URL)

        expect(file.filename).toBe('report.csv')
        expect(file.extension).toBe('csv')
        expect(file.size).toBe(11)
        expect((await readableToBuffer(file.body)).toString()).toBe('hello world')
    })

    it('drops the size when the body is compressed so the consumer falls back to buffering', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('hello', {
            headers: { 'content-type': 'text/csv', 'content-length': '5', 'content-encoding': 'gzip' },
        })))

        const file = await resolveStreamingFile(FILE_URL)

        expect(file.size).toBeUndefined()
    })

    it('resolves a trailing-dot filename to an undefined extension', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('data', {
            headers: { 'content-disposition': 'attachment; filename="archive."', 'content-length': '4' },
        })))

        const file = await resolveStreamingFile(FILE_URL)

        expect(file.filename).toBe('archive.')
        expect(file.extension).toBeUndefined()
    })

    it('resolves to null when the URL responds with a non-ok status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))

        expect(await materializeProcessed(FILE_URL, { required: false })).toBeNull()
    })

    it('cancels the response body when the URL responds with a non-ok status', async () => {
        const response = new Response('error page', { status: 404 })
        const cancelSpy = vi.spyOn(response.body!, 'cancel')
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

        expect(await materializeProcessed(FILE_URL, { required: false })).toBeNull()
        expect(cancelSpy).toHaveBeenCalled()
    })

    it('resolves a streaming file property to a lazy body without buffering', async () => {
        const file = await resolveStreamingFile(HELLO_TXT_DATA_URL)

        expect(file.filename).toBe('unknown.txt')
        expect(file.extension).toBe('txt')
        expect(file.size).toBe(5)
        expect((await readableToBuffer(file.body)).toString()).toBe('hello')
    })

    it('still resolves a plain file property to a buffered ApFile', async () => {
        const file = await materializeProcessed(HELLO_TXT_DATA_URL, { streaming: false })

        expect(file).toBeInstanceOf(ApFile)
        expect(file instanceof ApFile && file.data.toString()).toBe('hello')
    })
})
