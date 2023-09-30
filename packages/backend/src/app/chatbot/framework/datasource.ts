import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { Document } from 'langchain/document'
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'

export const datasources = {
    async parsePdf({ buffer }: {
        buffer: Buffer
    }): Promise<Document[]> {
        const blob = new Blob([buffer])
        const pdfLoader = new PDFLoader(blob, { splitPages: true })
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1300,
        })
        const documents = await pdfLoader.loadAndSplit(splitter)
        return documents
    },
}