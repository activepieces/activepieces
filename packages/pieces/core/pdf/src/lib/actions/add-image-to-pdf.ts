import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, degrees } from 'pdf-lib';
import { getTargetPages, mapVisualToIntrinsic } from '../common';
import mime from 'mime-types';
import { addImageToPdfActionOutputSchema } from '../output-schemas';

export const addImageToPdf = createAction({
  audience: 'both',
  name: 'addImageToPdf',
  classification: 'READ',
  displayName: 'Add Image to PDF',
  description: 'Stamp one or more images onto pages of an existing PDF.',
  aiMetadata: { description: 'Stamps one or more PNG or JPEG images onto an existing PDF at exact point offsets from the top-left corner, each item targeting either a single page or every page. Use it for signatures, logos or watermarks — prefer Add Text to PDF for text, and Image to PDF to turn an image into a standalone document. Each image must have a positive scale and fit entirely within the page bounds, otherwise the call fails; the input file is never modified and repeating the call produces the same stamped content, so idempotent.', idempotent: true },
  outputSchema: addImageToPdfActionOutputSchema,
  props: {
    file: Property.File({
      displayName: 'PDF File or URL',
      placeholder: 'https://example.com/document.pdf',
      required: true,
    }),
    imageItems: Property.Array({
      displayName: 'Images to Stamp',
      description: 'One item per image. Each can target one page or all pages.',
      required: true,
      properties: {
        imageFile: Property.File({
          displayName: 'Image File or URL',
          description: 'PNG or JPEG.',
          required: true,
        }),
        applyToAllPages: Property.Checkbox({
          displayName: 'Apply to All Pages',
          description: 'Stamp this item on every page and ignore Page Number.',
          required: false,
          defaultValue: false,
        }),
        pageNumber: Property.Number({
          displayName: 'Page Number',
          description: 'Pages start at 1. Ignored when Apply to All Pages is on.',
          required: false,
          defaultValue: 1,
        }),
        distanceFromLeft: Property.Number({
          displayName: 'Distance from Left',
          description: 'In points from the left edge. An A4 page is 595 points wide.',
          required: true,
        }),
        distanceFromTop: Property.Number({
          displayName: 'Distance from Top',
          description: 'In points from the top edge. An A4 page is 842 points tall.',
          required: true,
        }),
        scale: Property.Number({
          displayName: 'Scale',
          description: '1 keeps the original size, 0.5 halves it.',
          required: true,
          defaultValue: 1.0,
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
      const imageItems = context.propsValue.imageItems as Array<{
        imageFile: any;
        applyToAllPages?: boolean;
        pageNumber?: number;
        distanceFromLeft: number;
        distanceFromTop: number;
        scale: number;
      }>;

      const pdfDoc = await PDFDocument.load(file.data as any); 
      const pages = pdfDoc.getPages();

      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        
        if (item.scale <= 0) {
          throw new Error(`Scale must be a positive number. You provided ${item.scale} for image item ${i + 1}.`);
        }

        const imageData = item.imageFile.data;
        const filename = item.imageFile.filename || `item ${i + 1}`;
        
        const mimeType = item.imageFile.extension
          ? mime.lookup(item.imageFile.extension) || 'application/octet-stream'
          : mime.lookup(item.imageFile.filename || '') || 'application/octet-stream';

        let embeddedImage;
        if (mimeType === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageData);
        } else if (mimeType === 'image/jpeg') {
          embeddedImage = await pdfDoc.embedJpg(imageData);
        } else {
          throw new Error(
            `Unsupported image format for "${filename}". Expected a PNG or JPEG, but could not verify the file type.`
          );
        }

        const imgDims = embeddedImage.scale(item.scale);
        const scaledWidth = imgDims.width;
        const scaledHeight = imgDims.height;

        const targetPages = getTargetPages(pages, item.applyToAllPages, item.pageNumber, `image item ${i + 1}`);

        for (const targetPage of targetPages) {
          const { width, height } = targetPage.getSize();
          const rotationAngle = ((targetPage.getRotation()?.angle ?? 0) % 360 + 360) % 360;

          const isLandscape = rotationAngle === 90 || rotationAngle === 270;
          const vWidth = isLandscape ? height : width;
          const vHeight = isLandscape ? width : height;

          const vX = item.distanceFromLeft;
          const vY = vHeight - item.distanceFromTop;
          
          // Boundary Checks
          if (vX < 0 || vX > vWidth) throw new Error(`The Left distance (${item.distanceFromLeft}pts) for image item ${i + 1} is outside the page width.`);
          if (vX + scaledWidth > vWidth) throw new Error(`Image item ${i + 1} is too wide and runs off the right edge.`);
          if (vY < 0 || vY > vHeight) throw new Error(`The Top distance (${item.distanceFromTop}pts) for image item ${i + 1} is outside the page height.`);
          if (vY - scaledHeight < 0) throw new Error(`Image item ${i + 1} is too tall and runs off the bottom edge.`);

          // Use helper to calculate rotated mapping
          // (pdf-lib draws images from bottom-left corner, so anchor is vY - scaledHeight)
          const anchorY = vY - scaledHeight;
          const { iX, iY, mappedRotation } = mapVisualToIntrinsic(vX, anchorY, vWidth, vHeight, rotationAngle);

          targetPage.drawImage(embeddedImage, {
            x: iX,
            y: iY,
            width: scaledWidth,
            height: scaledHeight,
            rotate: degrees(mappedRotation),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();

      return context.files.write({
        data: Buffer.from(pdfBytes),
        fileName: `image_stamped_${file.filename}`,
      });

    } catch (error) {
      throw new Error(`Failed to add image to PDF: ${(error as Error).message}`);
    }
  },
});