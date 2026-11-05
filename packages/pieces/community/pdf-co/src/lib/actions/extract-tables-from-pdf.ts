import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { commonProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const extractTablesFromPdf = createAction({
	name: 'extract_tables_from_pdf',
	classification: 'READ',
	displayName: 'Extract Tables from PDF (using Template)',
	description: 'Extracts table data from a PDF using a predefined PDF.co Document Parser template.',
	audience: 'human',
	aiMetadata: {
		description:
			'Extracts table data from a source PDF (referenced by URL) using a predefined PDF.co Document Parser template; requires a Template ID created beforehand in the PDF.co dashboard. Agents should use Parse Document (AI), which also returns the template fields. Read-only and idempotent (consumes credits).',
		idempotent: true,
	},
	auth: pdfCoAuth,
	outputSchema: pdfCoOutputSchemas.extractTables,
	props: {
		url: Property.ShortText({
			displayName: 'Source PDF URL',
			description: 'URL of the PDF file to extract tables from.',
			required: true,
		}),
		templateId: Property.ShortText({
			displayName: 'Template ID',
			description: 'The ID of your Document Parser template (created in PDF.co dashboard) designed to extract the table(s).',
			required: true,
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description: 'Comma-separated page indexes or ranges (first page is 0), e.g. "0,2,5-10". Overrides template settings if provided.',
			required: false,
		}),
		profiles: Property.Json({
			displayName: 'Profiles',
			description: 'JSON object for additional configurations.',
			required: false,
		}),
		...commonProps,
	},
	async run({ auth, propsValue }) {
		const { url, templateId, pages, pdfPassword, fileName, httpPassword, httpUsername, expiration, profiles } = propsValue;
		const text = (value: unknown): value is string => typeof value === 'string' && value !== '';
		const serialized = pdfCoClient.serializeProfiles(profiles);
		const response = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey: pdfCoClient.apiKeyOf(auth),
				method: HttpMethod.POST,
				path: '/v1/pdf/documentparser',
				body: {
					url,
					templateId,
					httppassword: httpPassword,
					httpusername: httpUsername,
					async: false,
					inline: true,
					outputFormat: 'JSON',
					...(text(pages) ? { pages } : {}),
					...(text(pdfPassword) ? { password: pdfPassword } : {}),
					...(text(fileName) ? { name: fileName } : {}),
					...(expiration === undefined ? {} : { expiration }),
					...(serialized === undefined ? {} : { profiles: serialized }),
				},
			}),
		);
		const parsed = pdfCoClient.readRecord(response['body']);
		const objects = Array.isArray(parsed['objects']) ? parsed['objects'] : [];
		return {
			extractedTables: objects.filter((item) => pdfCoClient.readRecord(item)['objectType'] === 'table'),
			templateNameUsed: parsed['templateName'],
		};
	},
});
