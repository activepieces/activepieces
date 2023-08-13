import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { createDatasource } from '../framework/datasource';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { Document } from 'langchain/dist/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const pdfDataSource = createDatasource({
  name: 'pdf',
  description: 'PDF',
  auth: PieceAuth.None(),
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'URL of the pdf',
      required: true
    })
  },
  sync: async ({ propsValue }) => {
    const docs: Document[] = await load(propsValue.url);
    return transform(docs);
  }
});

async function load(url: string): Promise<Document[]> {
  const loader = new PDFLoader(url);
  return loader.load();
}

async function transform(docs: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0
  });
  return await splitter.splitDocuments(docs);
}
