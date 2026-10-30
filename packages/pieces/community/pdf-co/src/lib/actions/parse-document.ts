import { createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const parseDocument = createAction({
	auth: pdfCoAuth,
	name: 'parse_document',
	displayName: 'Parse Document with Template',
	description: 'Extract the fields and tables a Document Parser template defines from a PDF or scan.',
	audience: 'both',
	classification: 'READ',
	aiMetadata: {
		description:
			'Extracts every field and table defined by a PDF.co Document Parser template from a PDF or scan (public URL or file), e.g. invoices, statements or orders, returning fields as name/value pairs plus tables. Requires a template; use Parse Invoice with AI for invoice layouts without one. Costs 42 credits per page. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.parseDocument,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		templateId: pdfCoProps.templateDropdown({ kind: 'documentParser', required: true }),
		pages: pdfCoProps.pages({ base: 0 }),
		...pdfCoProps.inlineRead(),
	},
	async run({ auth, propsValue }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const templateId = parseTemplateId(propsValue.templateId);
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		const body = await pdfCoJobs.runInline({
			apiKey,
			path: '/v1/pdf/documentparser',
			body: { url, templateId, inline: true, outputFormat: 'JSON', ...(pages === undefined ? {} : { pages: pages.trim() }) },
			common: propsValue,
		});
		return flattenParserResult(body);
	},
});

export function parseTemplateId(value: unknown): number {
	const id = Number(typeof value === 'string' ? value.trim() : value);
	if (!Number.isInteger(id) || id <= 0) {
		throw new Error('Template ID must be a positive whole number, e.g. 1 for the built-in Invoice Parser.');
	}
	return id;
}

export function flattenParserResult(body: Record<string, unknown>): ParsedDocument {
	const result = pdfCoClient.readRecord(body['body']);
	const objects = Array.isArray(result['objects']) ? result['objects'] : [];
	const records = objects.map((item) => pdfCoClient.readRecord(item));
	const fields = Object.fromEntries(
		records
			.filter((object) => object['objectType'] === 'field' && typeof object['name'] === 'string')
			.map((object) => [String(object['name']), object['value']]),
	);
	const tables = records
		.filter((object) => object['objectType'] === 'table')
		.map((object) => ({ name: object['name'], page_index: object['pageIndex'] ?? firstCellPageIndex(object['rows']), rows: object['rows'] }));
	return {
		template_name: result['templateName'],
		fields,
		tables,
		page_count: body['pageCount'],
		credits_used: body['credits'],
		remaining_credits: body['remainingCredits'],
	};
}

function firstCellPageIndex(rows: unknown): unknown {
	if (!Array.isArray(rows) || rows.length === 0) {
		return undefined;
	}
	const cells = Object.values(pdfCoClient.readRecord(rows[0]));
	const pageIndex = cells.map((cell) => pdfCoClient.readRecord(cell)['pageIndex']).find((value) => typeof value === 'number');
	return pageIndex;
}

export type ParsedDocument = {
	template_name: unknown;
	fields: Record<string, unknown>;
	tables: { name: unknown; page_index: unknown; rows: unknown }[];
	page_count: unknown;
	credits_used: unknown;
	remaining_credits: unknown;
};
