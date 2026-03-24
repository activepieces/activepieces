declare module 'pdf-parse' {
    interface PdfParseOptions {
        pagerender?: (pageData: unknown) => string | Promise<string>
        max?: number
        version?: 'default' | 'v1.9.426' | 'v1.10.100' | 'v1.10.88' | 'v2.0.550'
    }

    interface PdfParseResult {
        numpages: number
        numrender: number
        info: Record<string, unknown>
        metadata: Record<string, unknown>
        text: string
        version: string
    }

    function pdfParse(dataBuffer: Buffer | Uint8Array, options?: PdfParseOptions): Promise<PdfParseResult>
    export default pdfParse
}
