import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument } from 'pdf-lib';

export const mergePdfs = createAction({
  name: 'mergePdfs',
  displayName: 'Merge PDFs',
  description: 'Merges multiple PDF files into a single PDF document.',
  props: {
    pdfFiles: Property.Array({
      displayName: 'PDF Files',
      description: 'Array of PDF files to merge',
      required: true,
      properties: {
        file: Property.File({
          displayName: 'PDF File',
          required: true,
        }),
      },
    }),
    outputFileName: Property.ShortText({
      displayName: 'Output File Name',
      description: 'Name for the merged PDF file (without extension)',
      required: false,
      defaultValue: 'merged-document',
    }),
  },
  async run(context) {
    try {
      const { pdfFiles, outputFileName } = context.propsValue;
      
      // pdfFiles is already an array from Property.Array
      
      if (!pdfFiles || !Array.isArray(pdfFiles) || pdfFiles.length < 2) {
        throw new Error('At least 2 PDF files are required for merging');
      }

      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfFiles.length; i++) {
        const fileItem = pdfFiles[i] as any;
        const file = fileItem.file;
        
        if (!file) {
          throw new Error(`File at index ${i} is null or undefined`);
        }

        // Handle PDF files only
        let fileData: Buffer;
        const fileName = file.filename || file.name || `file-${i}.pdf`;

        // Validate it's a PDF file
        if (fileName && !fileName.toLowerCase().endsWith('.pdf')) {
          throw new Error(`File at index ${i} (${fileName}) is not a PDF file`);
        }

        if (file.data) {
          // Handle base64 strings
          if (typeof file.data === 'string') {
            fileData = Buffer.from(file.data, 'base64');
          }
          // Handle Buffer objects serialized as JSON
          else if (file.data.type === 'Buffer' && Array.isArray(file.data.data)) {
            fileData = Buffer.from(file.data.data);
          }
          // Handle direct Buffer
          else if (Buffer.isBuffer(file.data)) {
            fileData = file.data;
          }
          else {
            throw new Error(`Unsupported data format for PDF file ${i}: ${typeof file.data}`);
          }
        }
        else {
          throw new Error(`PDF file at index ${i} has no data property`);
        }

        try {
          const pdfDoc = await PDFDocument.load(new Uint8Array(fileData));
          const pageCount = pdfDoc.getPageCount();
          const pageIndices = Array.from({ length: pageCount }, (_, idx) => idx);
          
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((page) => mergedPdf.addPage(page));
          
        } catch (error) {
          throw new Error(`Failed to process PDF file at index ${i} (${fileName}): ${(error as Error).message}`);
        }
      }

      const pdfBytes = await mergedPdf.save();
      
      return context.files.write({
        data: Buffer.from(pdfBytes),
        fileName: `${outputFileName || 'merged-document'}.pdf`,
      });
      
    } catch (error) {
      throw new Error(`Failed to merge PDFs: ${(error as Error).message}`);
    }
  },
});
