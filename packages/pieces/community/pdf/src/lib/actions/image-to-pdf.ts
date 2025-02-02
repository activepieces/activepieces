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

			const pdfDoc = await PDFDocument.create();
			const page = pdfDoc.addPage();
			const [pageWidth, pageHeight] = PageSizes.A4;
			page.setSize(pageWidth, pageHeight);

			const xMargin = 30;
			const yMargin = 30;
			const [maxCardWidth, maxCardHeight] = [pageWidth - xMargin * 2, pageHeight - yMargin * 2];

			let result: PDFImage | null = null;

			if (image.extension === 'png') {
				result = await pdfDoc.embedPng(image.data);
			} else if (image.extension === 'jpg' || image.extension === 'jpeg') {
				result = await pdfDoc.embedJpg(image.data);
			} else {
				throw new Error(`Unsupported image format: ${image.extension}`);
			}

			if (result === null) {
				throw new Error('Failed to embed image');
			}

			const exifOrientation = getImageOrientation(image.data.buffer);
			const orientationCorrection = getOrientationCorrection(exifOrientation);

			let scaledImage, correctedWidth, correctedHeight;
			switch (exifOrientation) {
				case 5:
				case 6:
				case 7:
				case 8:
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
				case 2:
					xShift = pageWidth - xMargin - correctedWidth;
					yShift = yOffset - correctedHeight;
					break;
				case 3:
					xShift = xMargin + correctedWidth;
					yShift = yOffset;
					break;
				case 4:
					xShift = pageWidth - xMargin;
					yShift = yOffset;
					break;
				case 5:
					xShift = xMargin + correctedWidth;
					yShift = pageHeight - yOffset;
					break;
				case 6:
					xShift = xMargin;
					yShift = yOffset;
					break;
				case 7:
					xShift = xMargin;
					yShift = pageHeight - yOffset + correctedHeight;
					break;
				case 8:
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

// https://github.com/Hopding/pdf-lib/issues/1284
// https://stackoverflow.com/questions/7584794/accessing-jpeg-exif-rotation-data-in-javascript-on-the-client-side/32490603#32490603
function getImageOrientation(file: ArrayBuffer): number {
	const view = new DataView(file);

	const length = view.byteLength;
	let offset = 2;

	while (offset < length) {
		if (view.getUint16(offset + 2, false) <= 8) return -1;
		const marker = view.getUint16(offset, false);
		offset += 2;

		// If EXIF buffer segment exists find the orientation
		if (marker == 0xffe1) {
			if (view.getUint32((offset += 2), false) != 0x45786966) {
				return -1;
			}

			const little = view.getUint16((offset += 6), false) == 0x4949;
			offset += view.getUint32(offset + 4, little);
			const tags = view.getUint16(offset, little);
			offset += 2;
			for (let i = 0; i < tags; i++) {
				if (view.getUint16(offset + i * 12, little) == 0x0112) {
					return view.getUint16(offset + i * 12 + 8, little);
				}
			}
		} else if ((marker & 0xff00) != 0xff00) {
			break;
		} else {
			offset += view.getUint16(offset, false);
		}
	}
	return -1;
}

// https://sirv.com/help/articles/rotate-photos-to-be-upright/#exif-orientation-values
function getOrientationCorrection(orientation: number): { degrees: number; mirrored?: 'x' | 'y' } {
	switch (orientation) {
		case 2:
			return { degrees: 0, mirrored: 'x' };
		case 3:
			return { degrees: -180 };
		case 4:
			return { degrees: 180, mirrored: 'x' };
		case 5:
			return { degrees: 90, mirrored: 'y' };
		case 6:
			return { degrees: -90 };
		case 7:
			return { degrees: -90, mirrored: 'y' };
		case 8:
			return { degrees: 90 };
		default:
			return { degrees: 0 };
	}
}
