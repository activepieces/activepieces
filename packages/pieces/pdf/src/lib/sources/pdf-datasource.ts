//import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { Document } from 'langchain/document';
import { createDatasource , PieceAuth, Property} from '@activepieces/pieces-framework';

const docs = [
  new Document({
    metadata: { foo: 'notion' },
    pageContent:
      'Ashraf is CEO of Activepieces, He loves to code and eat pizza in italy :O'
  }),
  new Document({
    metadata: { id: 'notion' },
    pageContent:
      'Activepieces Open source no-code workflow builder, designed to be extensible'
  })
];
// TODO FIX

export const pdfDataSource = createDatasource({
  name: 'from-file',
  displayName: 'PDF',
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
 //   const docs: Document[] = await load(propsValue.url);
    return docs
  }
});

/*
async function load(url: string): Promise<Document[]> {
  const loader = new PDFLoader(url);
  return loader.load();
}*/

/** 
async function transform(docs: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 0
  });
  return await splitter.splitDocuments(docs);
}
*/
