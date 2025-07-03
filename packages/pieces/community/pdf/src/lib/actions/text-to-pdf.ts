import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, StandardFonts } from 'pdf-lib';

export const textToPdf = createAction({
  name: 'textToPdf',
  displayName: 'Text to PDF',
  description: 'Convert text to PDF',
  props: {
    text: Property.LongText({
      displayName: 'text',
      description: 'Enter text to convert',
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
    const text = context.propsValue.text;

    const pageSize: [number, number] = [595, 842]; // Standard A4 size
    const margin = 50;
    const topMargin = 70;
    const fontSize = 12;
    const lineSpacing = 5;
    const paragraphSpacing = 8;
    const fontType: StandardFonts = StandardFonts.Helvetica;

    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage(pageSize);
      const { width, height } = page.getSize();

      const font = await pdfDoc.embedFont(fontType);

      const lineHeight = font.heightAtSize(fontSize) + lineSpacing;
      const maxWidth = width - margin * 2;

      const paragraphs = text.split('\n');
      let yPosition = height - topMargin;

      paragraphs.forEach((paragraph) => {
        const words = paragraph.split(' ');
        let line = '';

        words.forEach((word) => {
          const testLine = line + word + ' ';
          const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (testLineWidth > maxWidth) {
            page.drawText(line.trim(), {
              x: margin,
              y: yPosition,
              size: fontSize,
              font,
            });
            line = word + ' ';
            yPosition -= lineHeight;

            if (yPosition < margin + lineHeight) {
              page = pdfDoc.addPage(pageSize);
              yPosition = height - topMargin;
            }
          } else {
            line = testLine;
          }
        });

        if (line.trim()) {
          page.drawText(line.trim(), {
            x: margin,
            y: yPosition,
            size: fontSize,
            font,
          });
          yPosition -= lineHeight;
        }

        yPosition -= paragraphSpacing;

        if (yPosition < margin + lineHeight) {
          page = pdfDoc.addPage(pageSize);
          yPosition = height - topMargin;
        }
      });

      const pdfBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');

      return context.files.write({
        data: Buffer.from(base64Pdf, 'base64'),
        fileName: 'text.pdf',
      });
    } catch (error) {
      throw new Error(`Failed to convert text to PDF: ${(error as Error).message}`);
    }
  },
});
