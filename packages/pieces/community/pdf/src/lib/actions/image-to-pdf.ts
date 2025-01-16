import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, PDFImage } from 'pdf-lib';

export const imageToPdf = createAction({
  name: 'imageToPdf',
  displayName: 'Image to PDF',
  description: 'Convert image to PDF',
  props: {
  
      image: Property.File({
        displayName: 'image',
        description: 'Image has to be png, jpeg or jpg and it will be scaled down to fit the page when image is larger than an A4 page',
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
    const pageSize: [number, number] = [595, 842]; // Standard A4 size
    const image = context.propsValue.image;
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage(pageSize);
      let result: PDFImage | null = null
   
      if(image.extension === 'png'){
        result = await pdfDoc.embedPng(image.data);
      }
      else if(image.extension === 'jpg' || image.extension === 'jpeg'){
        result = await pdfDoc.embedJpg(image.data);
      }
      else {
        throw new Error(`Unsupported image format: ${image.extension}`);
      }
      if(result) {   
        // Calculate aspect ratio
        const imageAspectRatio = result.width / result.height;
        const pageAspectRatio = pageSize[0] / pageSize[1];
        
        let finalWidth = result.width;
        let finalHeight = result.height;
        
        // Scale down if image is larger than page while maintaining aspect ratio
        if (result.width > pageSize[0] || result.height > pageSize[1]) {
          if (imageAspectRatio > pageAspectRatio) {
            // Width is the limiting factor
            finalWidth = pageSize[0];
            finalHeight = pageSize[0] / imageAspectRatio;
          } else {
            // Height is the limiting factor
            finalHeight = pageSize[1];
            finalWidth = pageSize[1] * imageAspectRatio;
          }
        }
        
        // Calculate centering coordinates
        const x = (pageSize[0] - finalWidth) / 2;
        const y = (pageSize[1] - finalHeight) / 2;
        
        page.drawImage(result, {
          x,
          y,
          width: finalWidth,
          height: finalHeight,
        });
      }
      else {
        throw new Error(`Failed to embed image`);
      }

      const pdfBytes = await pdfDoc.save();
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');

      return context.files.write({
        data: Buffer.from(base64Pdf, 'base64'),
        fileName: `${image.filename}.pdf`,
      });
    } catch (error) {
      throw new Error(`Failed to convert text to PDF: ${(error as Error).message}`);
    }
  },
});
