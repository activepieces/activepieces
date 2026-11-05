import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { JobResult, pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const parseInvoiceWithAi = createAction({
	auth: pdfCoAuth,
	name: 'parse_invoice_with_ai',
	displayName: 'Parse Invoice with AI',
	description: 'Extract vendor, customer, totals, dates and line items from an invoice of any layout.',
	audience: 'both',
	classification: 'READ',
	aiMetadata: {
		description:
			'Uses PDF.co\'s AI Invoice Parser to extract vendor, customer, invoice number, dates, totals, tax and line items from an invoice PDF of any layout (public URL or file), no template needed. The job runs in the background and is checked for up to 4 minutes; if still running, status "working" and the job ID are returned: call this action again with only that Job ID to get the fields without starting a new parse. Costs 100 credits per page. Not idempotent: AI output can differ between runs.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.invoice,
	props: {
		sourceUrl: pdfCoProps.sourceUrl({ description: 'Public link to the invoice PDF (one invoice per file). Fill this or pick a file below, not both.' }),
		sourceFile: pdfCoProps.sourceFile(),
		customFields: Property.Array({
			displayName: 'Custom Fields',
			description: 'Extra fields to extract, in camelCase, e.g. storeNumber, deliveryDate.',
			required: false,
		}),
		lineItemStructure: Property.Json({
			displayName: 'Line Item Structure',
			description: 'Optional shape for each line item: field name to "string" or "number", e.g. {"description":"string","quantity":"number"}.',
			required: false,
		}),
		jobId: Property.ShortText({
			displayName: 'Job ID',
			description: 'To read an invoice job that returned status "working", paste its Job ID. The source and fields above are then not used and no new parse is started.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const pendingJobId = pdfCoFiles.nonEmptyString(propsValue.jobId?.trim());
		if (pendingJobId !== undefined) {
			return invoiceOutput(await pdfCoJobs.waitForJob({ apiKey, jobId: pendingJobId, checkImmediately: true }));
		}
		const customFields = (Array.isArray(propsValue.customFields) ? propsValue.customFields : [])
			.map((field) => String(field ?? '').trim())
			.filter((field) => field !== '');
		const invalidField = customFields.find((field) => !/^[A-Za-z][A-Za-z0-9]*$/.test(field));
		if (invalidField !== undefined) {
			throw new Error(`Custom field "${invalidField}" must be one camelCase word, e.g. deliveryDate.`);
		}
		const structure = validateStructure(propsValue.lineItemStructure);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		const result = await pdfCoJobs.runJob({
			apiKey,
			path: '/v1/ai-invoice-parser',
			body: {
				url,
				...(customFields.length === 0 ? {} : { customField: customFields.join(',') }),
				...(structure === undefined ? {} : { lineItemStructure: structure }),
			},
			background: true,
			alwaysAsync: true,
		});
		return invoiceOutput(result);
	},
});

async function invoiceOutput(result: JobResult): Promise<Record<string, unknown>> {
	if (result.status === 'working') {
		return {
			status: 'working',
			job_id: result.jobId,
			credits_used: result.body['credits'],
			remaining_credits: result.body['remainingCredits'],
		};
	}
	const invoice = await invoiceBody(result.body);
	return { status: 'success', job_id: result.jobId, ...flattenInvoice(invoice), page_count: result.body['pageCount'], credits_used: result.body['credits'], remaining_credits: result.body['remainingCredits'] };
}

function validateStructure(value: unknown): Record<string, string> | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	const record = pdfCoClient.readRecord(value);
	const entries = Object.entries(record);
	if (entries.length === 0 || entries.some(([, type]) => type !== 'string' && type !== 'number')) {
		throw new Error('Line Item Structure must be a JSON object whose values are "string" or "number".');
	}
	return Object.fromEntries(entries.map(([key, type]) => [key, String(type)]));
}

async function invoiceBody(body: Record<string, unknown>): Promise<Record<string, unknown>> {
	const inline = body['body'];
	if (typeof inline === 'object' && inline !== null) {
		return pdfCoClient.readRecord(inline);
	}
	const url = pdfCoFiles.nonEmptyString(body['url']);
	if (url === undefined) {
		throw new Error('PDF.co finished the invoice job but returned no result.');
	}
	const parsed = pdfCoClient.readRecord(await pdfCoFiles.readStorageJson({ url }));
	return typeof parsed['body'] === 'object' && parsed['body'] !== null ? pdfCoClient.readRecord(parsed['body']) : parsed;
}

function flattenInvoice(invoice: Record<string, unknown>): Record<string, unknown> {
	const vendor = pdfCoClient.readRecord(invoice['vendor']);
	const billTo = pdfCoClient.readRecord(pdfCoClient.readRecord(invoice['customer'])['billTo']);
	const details = pdfCoClient.readRecord(invoice['invoice']);
	const payment = pdfCoClient.readRecord(invoice['paymentDetails']);
	const rawItems = invoice['lineItems'];
	const lineItems = Array.isArray(rawItems) ? rawItems.flatMap((item) => (Array.isArray(item) ? item : [item])) : [];
	return {
		vendor_name: vendor['name'],
		customer_name: billTo['name'],
		invoice_number: details['invoiceNo'],
		invoice_date: details['invoiceDate'],
		due_date: details['dueDate'] ?? payment['dueDate'],
		po_number: details['poNo'],
		total: payment['total'] ?? details['total'],
		subtotal: payment['subtotal'] ?? details['subtotal'],
		tax: payment['tax'] ?? details['tax'],
		line_items: lineItems,
		invoice,
	};
}
