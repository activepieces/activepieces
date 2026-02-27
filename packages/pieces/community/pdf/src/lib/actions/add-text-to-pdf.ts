import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';

const fontOptions = Object.entries(StandardFonts).map(([key, value]) => {
  const formattedLabel = key.replace(/([A-Z])/g, ' $1').trim();
  return { label: formattedLabel, value: value };
});

export const addTextToPdf = createAction({
  name: 'addTextToPdf',
  displayName: 'Add Text to PDF',
  description: 'Stamps one or more text strings at exact pixel distances from the top-left corner.',
  props: {
    file: Property.File({
      displayName: 'PDF File or URL',
      required: true,
    }),
    textItems: Property.Array({
      displayName: 'Text Items to Insert',
      description: 'Add each piece of text you want to stamp.',
      required: true,
      properties: {
        text: Property.LongText({
          displayName: 'Text',
          required: true,
        }),
        applyToAllPages: Property.Checkbox({
          displayName: 'Apply to all pages?',
          description: 'If checked, this text is stamped on every page.',
          required: false,
          defaultValue: false,
        }),
        pageNumber: Property.Number({
          displayName: 'Page Number',
          description: 'Which page to stamp? (Leave blank or ignore if applying to all pages)',
          required: false,
					defaultValue: 1,
        }),
        distanceFromLeft: Property.Number({
          displayName: 'Distance from Left Edge (in pixels)',
					description: '0 is the far left edge of the page. Standard A4 width is about 595 pts.',
          required: true,
        }),
        distanceFromTop: Property.Number({
          displayName: 'Distance from Top Edge (in pixels)',
					description: '0 is the very top edge of the page. Standard A4 height is about 842 pts.',
          required: true,
        }),
        font: Property.StaticDropdown({
          displayName: 'Font',
          description: 'Select the exact font variant for this text item.',
          required: true,
          defaultValue: StandardFonts.Helvetica,
          options: {
            options: fontOptions,
          },
        }),
        fontSize: Property.Number({
          displayName: 'Font Size',
          required: true,
          defaultValue: 11,
        }),
        lineSpacing: Property.Number({
          displayName: 'Line Spacing',
          description: 'The vertical spacing multiplier between lines. (Examples: 1.0 = Single, 1.15 = Standard, 2.0 = Double)',
          required: false,
          defaultValue: 1.15,
        }),
      },
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
      const file = context.propsValue.file;
      const textItems = context.propsValue.textItems as Array<{
        text: string;
        applyToAllPages?: boolean;
        pageNumber?: number;
        distanceFromLeft: number;
        distanceFromTop: number;
        font: StandardFonts;
        fontSize: number;
        lineSpacing: number;
      }>;

      const pdfDoc = await PDFDocument.load(file.data as any); 
      const pages = pdfDoc.getPages();
      const totalPages = pages.length;

      const embeddedFonts: Record<string, PDFFont> = {};

      for (const item of textItems) {
				const cleanText = item.text.replace(/\r\n|\r/g, '\n');
        const lines = cleanText.split('\n');
        const cleanTextSample = cleanText.substring(0, 15);

        if (item.lineSpacing <= 0) {
          throw new Error(
            `Line Spacing must be a positive number greater than 0. You provided ${item.lineSpacing} for text "${cleanTextSample}..."`
          );
        }

				if (item.fontSize <= 0) {
					throw new Error(
						`Font Size must be a positive number greater than 0. You provided ${item.fontSize} for text "${cleanTextSample}..."`
					);
				}

        const actualLineHeight = item.fontSize * item.lineSpacing;

        const fontEnum = item.font;
        if (!embeddedFonts[fontEnum]) {
          embeddedFonts[fontEnum] = await pdfDoc.embedFont(fontEnum);
        }
        const font = embeddedFonts[fontEnum];

        const maxTextWidth = Math.max(
          ...lines.map(line => font.widthOfTextAtSize(line, item.fontSize))
        );

        const targetPages = [];
        
        if (item.applyToAllPages) {
          targetPages.push(...pages);
        } else {
          const pageNum = Number(item.pageNumber ?? 1); 
          const pageIndex = pageNum - 1;
          
          if (pageIndex < 0 || pageIndex >= totalPages) {
            throw new Error(
              `You requested Page ${pageNum} for text "${cleanTextSample}...", but this document only has ${totalPages} page(s).`
            );
          }
          targetPages.push(pages[pageIndex]);
        }

        for (const targetPage of targetPages) {
          const { width, height } = targetPage.getSize();

          const pdfY = height - item.distanceFromTop;
          
          // Check Left Edge
          if (item.distanceFromLeft < 0 || item.distanceFromLeft > width) {
            throw new Error(
              `The Left distance (${item.distanceFromLeft}pts) for "${cleanTextSample}..." is outside the page width. Current PDF's max width is ${Math.round(width)}pts.`
            );
          }

          // Check Right Edge (Long text running off the right edge)
          if (item.distanceFromLeft + maxTextWidth > width) {
              throw new Error(
                `The text "${cleanTextSample}..." is too long and runs off the right edge. Reduce the Left distance or font size.`
              );
          }

          // Check Top Edge
          if (pdfY < 0 || pdfY > height) {
            throw new Error(
              `The Top distance (${item.distanceFromTop}pts) for "${cleanTextSample}..." is outside the page height. Current PDF's max height is ${Math.round(height)}pts.`
            );
          }

          // Check Bottom Edge (Multi-line text running off the bottom)
          const lowestYPosition = pdfY - ((lines.length - 1) * actualLineHeight);
          
          if (lowestYPosition < 0) {
            throw new Error(
              `The text "${cleanTextSample}..." contains too many lines and runs off the bottom of the page. Reduce the Top distance, Font Size, or Line Spacing.`
            );
          }

          targetPage.drawText(cleanText, {
            x: item.distanceFromLeft,
            y: pdfY,
            size: item.fontSize,
            font: font,
            color: rgb(0, 0, 0),
            lineHeight: actualLineHeight,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');

      return context.files.write({
        data: Buffer.from(base64Pdf, 'base64'),
        fileName: `stamped_${file.filename}`,
      });
    } catch (error) {
      throw new Error(`Failed to add text to PDF: ${(error as Error).message}`);
    }
  },
});