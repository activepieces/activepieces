import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument } from 'pdf-lib';

export const removePassword = createAction({
  name: 'removePassword',
  displayName: 'Remove Password',
  description: 'Remove password protection from a PDF file to enable content manipulation',
  props: {
    file: Property.File({
      displayName: 'PDF File',
      description: 'Password-protected PDF file',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Password to unlock the PDF',
      required: true,
    }),
    outputFileName: Property.ShortText({
      displayName: 'Output File Name',
      description: 'Name for the unprotected PDF file (without extension)',
      required: false,
      defaultValue: 'unlocked-document',
    }),
  },
  errorHandlingOptions: {
    continueOnFailure: {
      defaultValue: false,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async run(context) {
    const { file, password, outputFileName } = context.propsValue;

    try {
      const pdfBytes = new Uint8Array(Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data));

      const pdfDoc = await PDFDocument.load(pdfBytes, {
        password,
        ignoreEncryption: true,
        updateMetadata: false,
      } as any);

      const decryptedBytes = await pdfDoc.save();

      return context.files.write({
        data: Buffer.from(decryptedBytes),
        fileName: `${outputFileName}.pdf`,
      });

    } catch (error) {
      const errorMessage = (error as Error).message || 'Unknown error';
      
      if (errorMessage.includes('password')) {
        throw new Error('Invalid password or PDF is not password-protected');
      }
      if (errorMessage.includes('encrypted') || errorMessage.includes('encryption')) {
        throw new Error('Unsupported encryption type.');
      }
      
      throw new Error(`Failed to remove password from PDF: ${errorMessage}`);
    }
  },
});

