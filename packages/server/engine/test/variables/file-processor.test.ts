import { buffer as readableToBuffer } from 'node:stream/consumers'
import { ApFile, ApStreamingFile, PieceAuth, Property } from '@activepieces/pieces-framework'
import { propsProcessor } from '../../src/lib/variables/props-processor'

const HELLO_TXT_DATA_URL = 'data:text/plain;base64,aGVsbG8='
const FILE_URL = 'https://example.com/report.csv'

async function resolveStreamingFile(input: unknown, required = true): Promise<{ processedInput: Record<string, unknown>, errors: Record<string, unknown> }> {
    const props = {
        file: Property.File({ displayName: 'File', required, streaming: true }),
    }
    return propsProcessor.applyProcessorsAndValidators(
        { file: input },
        props,
        PieceAuth.None(),
        false,
        {},
    )
}

describe('File Processor', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('resolves a streaming URL input to a lazy body, deriving size and name from headers', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('hello world', {
            headers: { 'content-type': 'text/csv', 'content-length': '11' },
        })))

        const { processedInput, errors } = await resolveStreamingFile(FILE_URL)

        expect(errors).toEqual({})
        const file: ApStreamingFile = processedInput.file
        expect(file.filename).toBe('report.csv')
        expect(file.extension).toBe('csv')
        expect(file.size).toBe(11)
        expect((await readableToBuffer(file.body)).toString()).toBe('hello world')
    })

    it('drops the size when the body is compressed so the consumer falls back to buffering', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('hello', {
            headers: { 'content-type': 'text/csv', 'content-length': '5', 'content-encoding': 'gzip' },
        })))

        const { processedInput } = await resolveStreamingFile(FILE_URL)

        const file: ApStreamingFile = processedInput.file
        expect(file.size).toBeUndefined()
    })

    it('resolves a trailing-dot filename to an undefined extension', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('data', {
            headers: { 'content-disposition': 'attachment; filename="archive."', 'content-length': '4' },
        })))

        const { processedInput } = await resolveStreamingFile(FILE_URL)

        const file: ApStreamingFile = processedInput.file
        expect(file.filename).toBe('archive.')
        expect(file.extension).toBeUndefined()
    })

    it('resolves to null when the URL responds with a non-ok status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })))

        const { processedInput } = await resolveStreamingFile(FILE_URL, false)

        expect(processedInput.file).toBeNull()
    })

    it('resolves a streaming file property to a lazy body without buffering', async () => {
        const props = {
            file: Property.File({ displayName: 'File', required: true, streaming: true }),
        }

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
            { file: HELLO_TXT_DATA_URL },
            props,
            PieceAuth.None(),
            false,
            {},
        )

        expect(errors).toEqual({})
        const file: ApStreamingFile = processedInput.file
        expect(file.filename).toBe('unknown.txt')
        expect(file.extension).toBe('txt')
        expect(file.size).toBe(5)
        expect((await readableToBuffer(file.body)).toString()).toBe('hello')
    })

    it('still resolves a plain file property to a buffered ApFile', async () => {
        const props = {
            file: Property.File({ displayName: 'File', required: true }),
        }

        const { processedInput, errors } = await propsProcessor.applyProcessorsAndValidators(
            { file: HELLO_TXT_DATA_URL },
            props,
            PieceAuth.None(),
            false,
            {},
        )

        expect(errors).toEqual({})
        const file: ApFile = processedInput.file
        expect(file).toBeInstanceOf(ApFile)
        expect(file.data.toString()).toBe('hello')
    })
})
