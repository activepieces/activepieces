import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, degrees } from 'pdf-lib';

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
      const totalPages = pages.length;

      for (let i = 0; i < imageItems.length; i++) {
        const item = imageItems[i];
        
        if (item.scale <= 0) {
          throw new Error(`Scale must be a positive number. You provided ${item.scale} for image item ${i + 1}.`);
        }

        // Detect and embed image (pdf-lib requires different methods for PNG vs JPG)
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

        const targetPages = [];
        
        if (item.applyToAllPages) {
          targetPages.push(...pages);
        } else {
          if (item.pageNumber === undefined) {
            throw new Error(`Page Number is required when "Apply to all pages?" is not checked for image item ${i + 1}.`);
          }
          const pageIndex = Number(item.pageNumber) - 1;
          
          if (pageIndex < 0 || pageIndex >= totalPages) {
            throw new Error(`You requested Page ${item.pageNumber} for image item ${i + 1}, but this document only has ${totalPages} page(s).`);
          }
          targetPages.push(pages[pageIndex]);
        }

        for (const targetPage of targetPages) {
          const { width, height } = targetPage.getSize();
          const rotationAngle = ((targetPage.getRotation()?.angle ?? 0) % 360 + 360) % 360;

          const isLandscape = rotationAngle === 90 || rotationAngle === 270;
          const vWidth = isLandscape ? height : width;
          const vHeight = isLandscape ? width : height;

          const vX = item.distanceFromLeft;
          const vY = vHeight - item.distanceFromTop;
          
          // Check Left Edge
          if (vX < 0 || vX > vWidth) {
            throw new Error(`The Left distance (${item.distanceFromLeft}pts) for image item ${i + 1} is outside the page width.`);
          }

          // Check Right Edge
          if (vX + scaledWidth > vWidth) {
              throw new Error(`Image item ${i + 1} is too wide and runs off the right edge. Reduce the Left distance or Scale.`);
          }

          // Check Top Edge
          if (vY < 0 || vY > vHeight) {
            throw new Error(`The Top distance (${item.distanceFromTop}pts) for image item ${i + 1} is outside the page height.`);
          }

          // Check Bottom Edge
          if (vY - scaledHeight < 0) {
            throw new Error(`Image item ${i + 1} is too tall and runs off the bottom edge. Reduce the Top distance or Scale.`);
          }

          // Map Visual coordinates back to Intrinsic coordinates for pdf-lib
          // Note: pdf-lib draws images from the bottom-left corner, not the top-left.
          // Therefore, the visual Y anchor is `vY - scaledHeight`.
          let iX = vX;
          let iY = vY - scaledHeight;
          let imageRotation = 0;

          if (rotationAngle === 90) {
            iX = vHeight - (vY - scaledHeight); 
            iY = vX;
            imageRotation = 90;
          } else if (rotationAngle === 180) {
            iX = vWidth - vX;
            iY = vHeight - (vY - scaledHeight);
            imageRotation = 180;
          } else if (rotationAngle === 270) {
            iX = vY - scaledHeight;
            iY = vWidth - vX;
            imageRotation = -90;
          }

          targetPage.drawImage(embeddedImage, {
            x: iX,
            y: iY,
            width: scaledWidth,
            height: scaledHeight,
            rotate: degrees(imageRotation),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');

      return context.files.write({
        data: Buffer.from(base64Pdf, 'base64'),
        fileName: `image_stamped_${file.filename}`,
      });
    } catch (error) {
      throw new Error(`Failed to add image to PDF: ${(error as Error).message}`);
    }
  },
});