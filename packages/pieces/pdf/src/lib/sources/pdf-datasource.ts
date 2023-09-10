import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { Document } from 'langchain/document';
import { createDatasource, PieceAuth, Property } from '@activepieces/pieces-framework';

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
    return load(propsValue.url);
  }
});

async function load(url: string): Promise<Document[]> {
  const blob = await downloadPdf(url);
  const loader = new PDFLoader(blob, {
    splitPages: false
  });
  return loader.load();
}


async function downloadPdf(url: string): Promise<Blob> {
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
}