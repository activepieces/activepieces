import { Property, createAction } from '@activepieces/pieces-framework';
import { parseOfficeAsync } from 'officeparser';
import { lookup } from 'mime-types';
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export const nativeTextExtraction = createAction({
  name: 'native_text_extraction',
  description:
    'Extract text from many a file types (pdf, docx, pptx, xlsx, odt, odp, ods)',
  displayName: 'Native Extraction',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to extract text from',
      required: true,
    }),
    precisePdfBreakingLines: Property.Checkbox({
      displayName: 'Precise PDF Breaking Lines',
      description:
        'The pdf breaking lines annalisis is expensive but should works for small files',
      defaultValue: false,
      required: false,
    }),
  },
  run: async ({ propsValue, files }) => {
    const file = propsValue.file;

    const preciseBreaksAnalysis = async (doc: PDFDocumentProxy) => {
      let extractText = '';
      for (let i = 0; i < doc.numPages; i++) {
        const extractedChunks = {} as {
          [y: number]: { x: number; text: string }[];
        };
        const textItems = (await (await doc.getPage(i)).getTextContent()).items;
        let lastY: number | undefined;
        for (const item of textItems) {
          if (!('str' in item)) continue;

          const text = item.str;
          const breakLine = item.hasEOL;
          const x = item.transform[4] as number;
          let y = item.transform[5] as number;
          const h = item.height;

          // check if there is a real break line
          // if the new chunk is upon or under (45% of the height if there a breakline specified and 100% else) the last chunk there is a break
          if (
            lastY &&
            ((breakLine && !(y - h * 0.45 > lastY || y + h * 0.45 < lastY)) ||
              !(y - h > lastY || y + h < lastY))
          ) {
            y = lastY;
          } else {
            lastY = y;
          }

          if (extractedChunks[y]) {
            extractedChunks[y].push({ x, text });
          } else {
            extractedChunks[y] = [{ x, text }];
          }
        }

        for (const y in extractedChunks) {
          extractText +=
            extractedChunks[y]
              .sort((a, b) => a.x - b.x)
              .map((chunk) => chunk.text)
              .join('') + '\n';
        }

        lastY = undefined;
        extractText += '\n';
      }
      return extractText;
    };

    const fastbreakAnalysis = async (doc: PDFDocumentProxy) => {
      const numPages = doc.numPages;
      const pageTextPromises = [];
      for (let i = 1; i <= numPages; i++) {
        const pagePromise = doc
          .getPage(i)
          .then((page) => page.getTextContent())
          .then((content) =>
            content.items
              .map((item) =>
                (item as TextItem).hasEOL
                  ? (item as TextItem).str + '\n'
                  : (item as TextItem).str
              )
              .join('')
          );
        pageTextPromises.push(pagePromise);
      }
      const pageTexts = await Promise.all(pageTextPromises);
      return pageTexts.join('\n');
    };

    let extractTextResult: string;
    const extension = file.extension;
    if (extension === 'pdf') {
      const doc = await getDocument({
        data: file.data.toString('binary'),
      }).promise;
      if (propsValue.precisePdfBreakingLines) {
        extractTextResult = await preciseBreaksAnalysis(doc);
      } else {
        extractTextResult = await fastbreakAnalysis(doc);
      }
    } else if (extension && lookup(extension) === 'text/plain') {
      extractTextResult = Buffer.from(file.data).toString('utf-8');
    } else {
      extractTextResult = await parseOfficeAsync(file.data);
    }

    return await files.write({
      data: Buffer.from(extractTextResult, 'utf-8'),
      fileName: file.filename + '.textract.txt',
    });
  },
});
