import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { PDFDocument } from 'pdf-lib';
import { extractPdfPagesActionOutputSchema } from '../output-schemas';

export function pageRangeToIndexes(
  startPage: number,
  endPage: number,
  totalPages: number
) {
  if (startPage > endPage) {
    throw Error(
      `Range start (${startPage}) has to be less than range end (${endPage})`
    );
  }

  if (startPage === 0 || endPage === 0) {
    throw Error('Range start/end has to be a non-zero number');
  }

  if (Math.abs(startPage) > totalPages || Math.abs(endPage) > totalPages) {
    throw Error(
      'Range start/end has to be less or equal to the total number of pages'
    );
  }

  if (startPage < 0 && endPage > 0) {
    throw Error('Range start cannot be negative when end is positive');
  }

  // page is 1 indexed, handle positive case
  let startIndex = startPage - 1;
  // handle negative case
  if (startPage < 0) {
    startIndex = totalPages + startPage;
  }

  // page is 1 indexed, handle positive case
  let endIndex = endPage - 1;
  // handle negative case
  if (endPage < 0) {
    endIndex = totalPages + endPage;
  }

  return Array.from(
    { length: endIndex - startIndex + 1 },
    (_, idx) => startIndex + idx
  );
}

const markdownValue = `
Ranges are copied in the order listed, so pages can be reordered.

- Pages start at 1. Start and end are inclusive; use the same number for one page.
- Negative numbers count from the end: -1 is the last page, -5 to -1 the last five.
- A range cannot cross 0.
`;

export const extractPdfPages = createAction({
  audience: 'both',
  name: 'extractPdfPages',
  classification: 'READ',
  displayName: 'Extract PDF Pages',
  description: 'Copy page ranges from a PDF into a new file, in the order given.',
  aiMetadata: { description: 'Builds a new PDF from page ranges taken from a source PDF; because ranges are copied in the order given, it both extracts/trims and reorders pages. Use it to split or resequence one document — use Merge PDFs to join separate files, and PDF Page Count first if bounds are unknown. Ranges are 1-indexed and inclusive, negatives count from the end (start -5, end -1 is the last five pages), and no range may span across 0; the source file is untouched and repeating the call produces the same page content, so idempotent.', idempotent: true },
  outputSchema: extractPdfPagesActionOutputSchema,
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: markdownValue,
    }),
    file: Property.File({
      displayName: 'PDF File or URL',
      required: true,
      placeholder: 'https://example.com/document.pdf',
    }),
    pageRanges: Property.Array({
      displayName: 'Page Ranges',
      description: 'One item per range. Order here is the page order in the output.',
      properties: {
        startPage: Property.Number({
          displayName: 'Start Page',
          description: 'First page of the range. Pages start at 1.',
          required: true,
        }),
        endPage: Property.Number({
          displayName: 'End Page',
          description: 'Last page of the range, inclusive.',
          required: true,
        }),
      },
      required: true,
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
    try {
      const srcDoc = await PDFDocument.load(context.propsValue.file.data as any);

      const totalPages = srcDoc.getPageCount();
      const pageIndexes = context.propsValue.pageRanges.flatMap(
        (pageRange: any) =>
          pageRangeToIndexes(pageRange.startPage, pageRange.endPage, totalPages)
      );

      const newDoc = await PDFDocument.create();
      const newPages = await newDoc.copyPages(srcDoc, pageIndexes);
      newPages.forEach((newPage) => newDoc.addPage(newPage));

      const pdfBytes = await newDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');

      return context.files.write({
        data: Buffer.from(base64Pdf, 'base64'),
        fileName: context.propsValue.file.filename,
      });
    } catch (error) {
      throw new Error(`Failed to extract pages: ${(error as Error).message}`);
    }
  },
});
