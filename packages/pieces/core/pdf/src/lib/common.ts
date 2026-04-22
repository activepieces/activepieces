import { PDFPage, PDFDocument } from 'pdf-lib';

/**
 * Resolves which pages to apply the stamp to based on user input.
 */
export function getTargetPages(
  pages: PDFPage[],
  applyToAllPages: boolean = false,
  pageNumber?: number,
  itemName: string = 'Item'
): PDFPage[] {
  const totalPages = pages.length;

  if (applyToAllPages) {
    return [...pages];
  }

  if (pageNumber === undefined) {
    throw new Error(`Page Number is required when "Apply to all pages?" is not checked for ${itemName}.`);
  }

  const pageIndex = Number(pageNumber) - 1;
  
  if (pageIndex < 0 || pageIndex >= totalPages) {
    throw new Error(`You requested Page ${pageNumber} for ${itemName}, but this document only has ${totalPages} page(s).`);
  }

  return [pages[pageIndex]];
}

/**
 * Maps visual coordinates (Top/Left) to pdf-lib intrinsic coordinates based on page rotation.
 */
export function mapVisualToIntrinsic(
  vX: number,
  anchorY: number, 
  vWidth: number,
  vHeight: number,
  rotationAngle: number
) {
  let iX = vX;
  let iY = anchorY;
  let mappedRotation = 0;

  if (rotationAngle === 90) {
    iX = vHeight - anchorY; 
    iY = vX;
    mappedRotation = 90;
  } else if (rotationAngle === 180) {
    iX = vWidth - vX;
    iY = vHeight - anchorY;
    mappedRotation = 180;
  } else if (rotationAngle === 270) {
    iX = anchorY;
    iY = vWidth - vX;
    mappedRotation = -90;
  }

  return { iX, iY, mappedRotation };
}

/**
 * Saves the PDF and writes it to the Activepieces file system.
 */
export async function savePdfToContext(
  pdfDoc: PDFDocument,
  originalFilename: string,
  prefix: string,
  context: any 
) {
  const pdfBytes = await pdfDoc.save();
  const base64Pdf = Buffer.from(pdfBytes).toString('base64');

  return context.files.write({
    data: Buffer.from(base64Pdf, 'base64'),
    fileName: `${prefix}_${originalFilename}`,
  });
}

/**
 * Detects if a buffer is a PNG or JPG based on its magic numbers.
 */
export function detectImageType(buffer: Buffer, itemIdentifier: string): 'png' | 'jpg' {
  if (buffer.length >= 8) {
    // PNG signature: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'png';
    }

    // JPG/JPEG signature: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'jpg';
    }
  }

  throw new Error(`Unable to detect image type for ${itemIdentifier}. Ensure the buffer is a valid PNG or JPG.`);
}
