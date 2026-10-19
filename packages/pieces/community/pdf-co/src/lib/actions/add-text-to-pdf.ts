import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoJobs } from '../common/jobs';
import { commonProps, PDF_CO_DEFAULTS, pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const addTextToPdf = createAction({
	name: 'add_text_to_pdf',
	classification: 'WRITE',
	displayName: 'Add Text to PDF',
	description: 'Adds text to PDF.',
	audience: 'human',
	aiMetadata: {
		description:
			'Stamps a text annotation onto a source PDF (referenced by URL) at the given x/y coordinates, with optional font, size, color, and styling. Page indexes start at 0. Agents should use Edit PDF (AI), which adds several texts, images and form values in one call. Each call produces a new output PDF file and consumes credits, so it is not idempotent.',
		idempotent: false,
	},
	auth: pdfCoAuth,
	outputSchema: pdfCoOutputSchemas.legacyEdit,
	props: {
		url: Property.ShortText({
			displayName: 'Source PDF URL',
			description: 'URL of the PDF file to modify.',
			required: true,
		}),
		text: Property.LongText({
			displayName: 'Text to Add',
			required: true,
		}),
		xCoordinate: Property.Number({
			displayName: 'X Coordinate',
			required: true,
		}),
		yCoordinate: Property.Number({
			displayName: 'Y Coordinate',
			required: true,
		}),
		fontSize: Property.Number({
			displayName: 'Font Size',
			required: false,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			defaultValue: '#000000',
			required: false,
		}),
		fontBold: Property.Checkbox({
			displayName: 'Bold Font ?',
			required: false,
		}),
		fontStrikeout: Property.Checkbox({
			displayName: 'Stikeout Font ?',
			required: false,
		}),
		fontUnderline: Property.Checkbox({
			displayName: 'Underline Font ?',
			required: false,
		}),
		fontName: Property.ShortText({
			displayName: 'Font Name',
			defaultValue: 'Arial',
			required: false,
		}),
		pages: Property.ShortText({
			displayName: 'Target Pages',
			description:
				'Page indexes as comma-separated values or ranges (first page is 0), e.g. "0, 1, 2-" or "1, 2, 3-7".',
			required: false,
		}),
		textBoxHeight: Property.Number({
			displayName: 'Text Box Height',
			required: false,
		}),
		textBoxWidth: Property.Number({
			displayName: 'Text Box Width',
			required: false,
		}),
		textBoxAlignment: Property.StaticDropdown({
			displayName: 'Text Box Alignment',
			required: false,
			defaultValue: 'left',
			options: {
				disabled: false,
				options: [
					{ label: 'left', value: 'left' },
					{ label: 'right', value: 'right' },
					{ label: 'center', value: 'center' },
				],
			},
		}),
		...commonProps,
		saveOutputFile: pdfCoProps.saveOutputFile({ defaultValue: PDF_CO_DEFAULTS.saveOutputFileOnExistingActions }),
	},
	async run({ auth, propsValue, files }) {
		const body = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey: pdfCoClient.apiKeyOf(auth),
				method: HttpMethod.POST,
				path: '/v1/pdf/edit/add',
				body: {
					url: propsValue.url,
					annotations: [
						{
							x: propsValue.xCoordinate,
							y: propsValue.yCoordinate,
							text: propsValue.text,
							type: 'text',
							color: propsValue.color,
							pages: propsValue.pages,
							width: propsValue.textBoxWidth,
							height: propsValue.textBoxHeight,
							alignment: propsValue.textBoxAlignment,
							size: propsValue.fontSize,
							fontName: propsValue.fontName,
							fontBold: propsValue.fontBold,
							fontStrikeout: propsValue.fontStrikeout,
							fontUnderline: propsValue.fontUnderline,
						},
					],
					async: false,
					name: propsValue.fileName,
					expiration: propsValue.expiration,
					httppassword: propsValue.httpPassword,
					httpusername: propsValue.httpUsername,
					password: propsValue.pdfPassword,
				},
			}),
		);
		return pdfCoJobs.legacyEditOutput({ body, files, saveOutputFile: propsValue.saveOutputFile, fileName: propsValue.fileName });
	},
});
