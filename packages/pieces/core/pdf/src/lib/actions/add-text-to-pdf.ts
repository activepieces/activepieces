import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, rgb, StandardFonts, PDFFont, degrees } from 'pdf-lib';
import { getTargetPages, mapVisualToIntrinsic } from '../common';

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
        lineSpacing?: number;
      }>;

      const pdfDoc = await PDFDocument.load(file.data as any); 
      const pages = pdfDoc.getPages();
      const embeddedFonts: Record<string, PDFFont> = {};

      for (const item of textItems) {
				const cleanText = item.text.replace(/\r\n|\r/g, '\n');
        const lines = cleanText.split('\n');
        const cleanTextSample = cleanText.substring(0, 15);
        const lineSpacing = item.lineSpacing ?? 1.15;

        if (lineSpacing <= 0) {
          throw new Error(`Line Spacing must be a positive number greater than 0. You provided ${lineSpacing} for text "${cleanTextSample}..."`);
        }
        if (item.fontSize <= 0) {
          throw new Error(`Font Size must be a positive number greater than 0. You provided ${item.fontSize} for text "${cleanTextSample}..."`);
        }

        const actualLineHeight = item.fontSize * lineSpacing;
        const fontEnum = item.font;
        
        if (!embeddedFonts[fontEnum]) {
          embeddedFonts[fontEnum] = await pdfDoc.embedFont(fontEnum);
        }
        const font = embeddedFonts[fontEnum];

        const maxTextWidth = Math.max(...lines.map(line => font.widthOfTextAtSize(line, item.fontSize)));
        
        // Use helper to resolve target pages
        const targetPages = getTargetPages(pages, item.applyToAllPages, item.pageNumber, `text "${cleanTextSample}..."`);

        for (const targetPage of targetPages) {
          const { width, height } = targetPage.getSize();
          const rotationAngle = ((targetPage.getRotation()?.angle ?? 0) % 360 + 360) % 360;

          const isLandscape = rotationAngle === 90 || rotationAngle === 270;
          const vWidth = isLandscape ? height : width;
          const vHeight = isLandscape ? width : height;

          const vX = item.distanceFromLeft;
          const vY = vHeight - item.distanceFromTop;
          
          // Boundary Checks
          if (vX < 0 || vX > vWidth) throw new Error(`The Left distance (${item.distanceFromLeft}pts) for "${cleanTextSample}..." is outside the page width.`);
          if (vX + maxTextWidth > vWidth) throw new Error(`The text "${cleanTextSample}..." is too long and runs off the right edge.`);
          if (vY < 0 || vY > vHeight) throw new Error(`The Top distance (${item.distanceFromTop}pts) for "${cleanTextSample}..." is outside the page height.`);

          const lineOverflow = (lines.length - 1) * actualLineHeight;
          if (rotationAngle === 90 && vX - lineOverflow < 0) throw new Error(`The text "${cleanTextSample}..." runs off the left edge.`);
          else if (rotationAngle === 180 && vY + lineOverflow > vHeight) throw new Error(`The text "${cleanTextSample}..." runs off the top.`);
          else if (rotationAngle === 270 && vX + lineOverflow > vWidth) throw new Error(`The text "${cleanTextSample}..." runs off the right edge.`);
          else if (rotationAngle === 0 && vY - lineOverflow < 0) throw new Error(`The text "${cleanTextSample}..." runs off the bottom.`);

          // Use helper to calculate rotated mapping 
          // (pdf-lib draws text from the baseline, so vY is our anchor)
          const { iX, iY, mappedRotation } = mapVisualToIntrinsic(vX, vY, vWidth, vHeight, rotationAngle);

          targetPage.drawText(cleanText, {
            x: iX,
            y: iY,
            size: item.fontSize,
            font: font,
            color: rgb(0, 0, 0),
            lineHeight: actualLineHeight,
            rotate: degrees(mappedRotation),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');

      return context.files.write({
        data: Buffer.from(base64Pdf, 'base64'),
        fileName: `text_stamped_${file.filename}`,
      });

    } catch (error) {
      throw new Error(`Failed to add text to PDF: ${(error as Error).message}`);
    }
  },
});