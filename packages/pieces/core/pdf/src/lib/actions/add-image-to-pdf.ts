import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, degrees } from 'pdf-lib';
import { getTargetPages, mapVisualToIntrinsic, savePdfToContext } from '../common';

export const addImageToPdf = createAction({
  name: 'addImageToPdf',
  displayName: 'Add Image to PDF',
  description: 'Stamps one or more images (PNG or JPG) at exact pixel distances from the top-left corner.',
  props: {
    file: Property.File({
      displayName: 'PDF File or URL',
      required: true,
    }),
    imageItems: Property.Array({
      displayName: 'Image Items to Insert',
      description: 'Add each image you want to stamp.',
      required: true,
      properties: {
        imageFile: Property.File({
          displayName: 'Image File (PNG/JPG)',
          description: 'The signature or image file to insert.',
          required: true,
        }),
        applyToAllPages: Property.Checkbox({
          displayName: 'Apply to all pages?',
          description: 'If checked, this image is stamped on every page.',
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
        scale: Property.Number({
          displayName: 'Image Scale',
          description: 'Scale multiplier for the image (e.g., 0.5 for half size, 1.0 for original size).',
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

        let embeddedImage;
        const imageData = item.imageFile.data;
        try {
          embeddedImage = await pdfDoc.embedPng(imageData);
        } catch (pngError) {
          try {
            embeddedImage = await pdfDoc.embedJpg(imageData);
          } catch (jpgError) {
            throw new Error(`Failed to embed image item ${i + 1}. Ensure the file is a valid PNG or JPG format.`);
          }
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

      return await savePdfToContext(pdfDoc, file.filename, 'image_stamped', context);

    } catch (error) {
      throw new Error(`Failed to add image to PDF: ${(error as Error).message}`);
    }
  },
});