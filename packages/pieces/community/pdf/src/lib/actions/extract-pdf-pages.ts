import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument } from 'pdf-lib';
import { MarkdownVariant } from '@activepieces/shared';

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

  if (startPage > totalPages || endPage > totalPages) {
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
This action can extract or rearrange the pages in a PDF.

- The order of array determines the sequence of pages.
- Each array element is one inclusive continuous range with a start page and end page.
- Pages start from 1, and 0 is not valid.
- Start page has to be less than end page.
- You can select one page by setting the same start and end page.
- To select pages from the start, specify negative pages eg. -1 is the last page, -5 is the 5th last page. start: -5, end: -1 are the last 5 pages.
- Range cannot span across 0 eg. start: -3, end: 5.
`;

export const extractPdfPages = createAction({
  name: 'extractPdfPages',
  displayName: 'Extract PDF Pages',
  description: 'Extract or rearrange page(s)from PDF File.',
  props: {
    markdown: Property.MarkDown({
      variant: MarkdownVariant.INFO,
      value: markdownValue,
    }),
    file: Property.File({
      displayName: 'PDF File or URL',
      required: true,
    }),
    pageRanges: Property.Array({
      displayName: 'Page Ranges',
      properties: {
        startPage: Property.Number({
          displayName: 'Start Page',
          required: true,
        }),
        endPage: Property.Number({
          displayName: 'End Page',
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
      const srcDoc = await PDFDocument.load(context.propsValue.file.data);

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
