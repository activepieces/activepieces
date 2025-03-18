import { createAction, Property } from '@activepieces/pieces-framework';
import { PDFDocument, PDFImage, RotationTypes, PageSizes } from 'pdf-lib';

export const imageToPdf = createAction({
	name: 'imageToPdf',
	displayName: 'Image to PDF',
	description: 'Convert image to PDF',
	props: {
		image: Property.File({
			displayName: 'image',
			description:
				'Image has to be png, jpeg or jpg and it will be scaled down to fit the page when image is larger than an A4 page',
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
			const image = context.propsValue.image;
			const imageExtension = image.extension?.toLowerCase();

			const pdfDoc = await PDFDocument.create();
			const page = pdfDoc.addPage();
			const [pageWidth, pageHeight] = PageSizes.A4;
			page.setSize(pageWidth, pageHeight);

			const xMargin = 30;
			const yMargin = 30;
			const [maxCardWidth, maxCardHeight] = [pageWidth - xMargin * 2, pageHeight - yMargin * 2];

			let result: PDFImage | null = null;

			if (imageExtension === 'png') {
				result = await pdfDoc.embedPng(image.data);
			} else if (imageExtension === 'jpg' || imageExtension === 'jpeg') {
				result = await pdfDoc.embedJpg(image.data);
			} else {
				throw new Error(`Unsupported image format: ${imageExtension}`);
			}

			if (result === null) {
				throw new Error('Failed to embed image');
			}

			const exifOrientation = getImageOrientation(image.data.buffer);
			const orientationCorrection = getOrientationCorrection(exifOrientation);

			let scaledImage, correctedWidth, correctedHeight;
			switch (exifOrientation) {
				case ImageOrientation.FlipHorizontalRotate90:
				case ImageOrientation.Rotate90:
				case ImageOrientation.FlipVerticalRotate90:
				case ImageOrientation.Rotate270:
					// The uploaded image is rotated +/- 90 degrees
					scaledImage = result.scaleToFit(maxCardHeight, maxCardWidth);
					correctedWidth = scaledImage.height;
					correctedHeight = scaledImage.width;
					break;
				default:
					scaledImage = result.scaleToFit(maxCardWidth, maxCardHeight);
					correctedWidth = scaledImage.width;
					correctedHeight = scaledImage.height;
			}

			let xShift, yShift;
			const yOffset = pageHeight - yMargin;
			switch (exifOrientation) {
				case ImageOrientation.FlipHorizontal:
					xShift = pageWidth - xMargin - correctedWidth;
					yShift = yOffset - correctedHeight;
					break;
				case ImageOrientation.Rotate180:
					xShift = xMargin + correctedWidth;
					yShift = yOffset;
					break;
				case ImageOrientation.FlipVertical:
					xShift = pageWidth - xMargin;
					yShift = yOffset;
					break;
				case ImageOrientation.FlipHorizontalRotate90:
					xShift = xMargin + correctedWidth;
					yShift = pageHeight - yOffset;
					break;
				case ImageOrientation.Rotate90:
					xShift = xMargin;
					yShift = yOffset;
					break;
				case ImageOrientation.FlipVerticalRotate90:
					xShift = xMargin;
					yShift = pageHeight - yOffset + correctedHeight;
					break;
				case ImageOrientation.Rotate270:
					xShift = xMargin + correctedWidth;
					yShift = yOffset - correctedHeight;
					break;
				default:
					xShift = xMargin;
					yShift = yOffset - correctedHeight;
			}

			page.drawImage(result, {
				x: xShift,
				y: yShift,
				height: scaledImage.height,
				width: scaledImage.width,
				rotate: { angle: orientationCorrection.degrees, type: RotationTypes.Degrees },
			});

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

// https://sirv.com/help/articles/rotate-photos-to-be-upright/#exif-orientation-values
enum ImageOrientation {
	Normal = 1, // "Image is in normal orientation, no rotation or flipping"
    Rotate90 = 6, // "Image is rotated 90 degrees"
    Rotate180 = 3, // "Image is rotated 180 degrees"
    Rotate270 = 8, // "Image is rotated 270 degrees"
    FlipHorizontal = 2, // "Image is flipped horizontally"
    FlipVertical = 4, // "Image is flipped horizontally and rotated 180 degrees"
    FlipHorizontalRotate90 = 5, // "Image is rotated 90 degrees and flipped horizontally"
    FlipVerticalRotate90 = 7, // "Image is rotated 270 degrees and flipped horizontally"
	Unknown= -1
	
}

// https://github.com/Hopding/pdf-lib/issues/1284
// https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side/32490603#32490603
function getImageOrientation(file: ArrayBuffer): ImageOrientation {
	const view = new DataView(file);

	const length = view.byteLength;
	let offset = 2;

	while (offset < length) {
		if (view.getUint16(offset + 2, false) <= 8) return ImageOrientation.Unknown;
		const marker = view.getUint16(offset, false);
		offset += 2;

		// If EXIF buffer segment exists find the orientation
		if (marker == 0xffe1) {
			if (view.getUint32((offset += 2), false) != 0x45786966) {
				return ImageOrientation.Unknown;
			}

			const little = view.getUint16((offset += 6), false) == 0x4949;
			offset += view.getUint32(offset + 4, little);
			const tags = view.getUint16(offset, little);
			offset += 2;
			for (let i = 0; i < tags; i++) {
				if (view.getUint16(offset + i * 12, little) == 0x0112) {
					const orientation = view.getUint16(offset + i * 12 + 8, little);
					switch (orientation) {
                        case 1: return ImageOrientation.Normal;
                        case 3: return ImageOrientation.Rotate180;
                        case 6: return ImageOrientation.Rotate90;
                        case 8: return ImageOrientation.Rotate270;
                        case 2: return ImageOrientation.FlipHorizontal;
                        case 4: return ImageOrientation.FlipVertical;
                        case 5: return ImageOrientation.FlipHorizontalRotate90;
                        case 7: return ImageOrientation.FlipVerticalRotate90;
                        default: return ImageOrientation.Unknown;
                    }
				}
			}
		} else if ((marker & 0xff00) != 0xff00) {
			break;
		} else {
			offset += view.getUint16(offset, false);
		}
	}
	return ImageOrientation.Unknown;
}

function getOrientationCorrection(orientation: number): { degrees: number; mirrored?: 'x' | 'y' } {
	switch (orientation) {
		case ImageOrientation.FlipHorizontal:
			return { degrees: 0, mirrored: 'x' };
		case ImageOrientation.Rotate180:
			return { degrees: -180 };
		case ImageOrientation.FlipVertical:
			return { degrees: 180, mirrored: 'x' };
		case ImageOrientation.FlipHorizontalRotate90:
			return { degrees: 90, mirrored: 'y' };
		case ImageOrientation.Rotate90:
			return { degrees: -90 };
		case ImageOrientation.FlipVerticalRotate90:
			return { degrees: -90, mirrored: 'y' };
		case ImageOrientation.Rotate270:
			return { degrees: 90 };
		default:
			return { degrees: 0 };
	}
}
