import { HttpMethod } from '@activepieces/pieces-common';
import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient, PDF_CO_BASE_URL } from './client';

function saveOutputFileProp({ defaultValue }: { defaultValue: boolean }) {
	return Property.Checkbox({
		displayName: 'Save Result as File',
		description:
			'Download the result and keep it as a file in this flow, so later steps can use it after the PDF.co link expires (links last 60 minutes by default). Files over 100 MB are not saved; the link is still returned.',
		required: false,
		defaultValue,
	});
}

function sourceUrlProp({ displayName = 'Source File URL', description }: { displayName?: string; description?: string } = {}) {
	return Property.ShortText({
		displayName,
		description:
			description ??
			'Public link to the file (for example a PDF on Google Drive, Dropbox or S3). Fill this or pick a file below, not both.',
		required: false,
	});
}

function sourceFileProp({ displayName = 'Source File', description }: { displayName?: string; description?: string } = {}) {
	return Property.File({
		displayName,
		description:
			description ??
			'A file from an earlier step. It is uploaded to PDF.co temporary storage first (7 extra credits). Fill this or the URL above, not both.',
		required: false,
	});
}

function pagesProp({ base, description }: { base: 0 | 1; description?: string }) {
	const example = base === 0 ? '"0,2,5-10" or "3-" (first page is 0)' : '"1,3,5-10" or "3-" (first page is 1)';
	return Property.ShortText({
		displayName: 'Pages',
		description:
			description ?? `Comma-separated pages or ranges, e.g. ${example}. Use "!0" for the last page. Leave empty for all pages.`,
		required: false,
	});
}

function outputProps({ background = true }: { background?: boolean } = {}) {
	return {
		outputName: Property.ShortText({
			displayName: 'Output File Name',
			description: 'Name for the result file, e.g. "result.pdf". Leave empty to let PDF.co pick one.',
			required: false,
		}),
		expiration: Property.Number({
			displayName: 'Link Expiration (minutes)',
			description: 'How long the PDF.co result link stays valid. Default 60. The maximum depends on your PDF.co plan.',
			required: false,
		}),
		...(background ? { runInBackground: runInBackgroundProp() } : {}),
		saveOutputFile: saveOutputFileProp({ defaultValue: PDF_CO_DEFAULTS.saveOutputFileOnNewActions }),
	};
}

function runInBackgroundProp() {
	return Property.Checkbox({
		displayName: 'Run in Background',
		description:
			'For large files. PDF.co processes the job in the background and this step checks it for up to 4 minutes (each check costs 2 credits). If it is still running, the step returns the job ID; use Check Job Status later.',
		required: false,
		defaultValue: false,
	});
}

function passwordProps() {
	return {
		pdfPassword: Property.ShortText({
			displayName: 'Source PDF Password',
			description: 'Password to open the source PDF, if it is protected.',
			required: false,
		}),
	};
}

function httpAuthProps() {
	return {
		httpUsername: Property.ShortText({
			displayName: 'HTTP Username',
			description: 'Username if the source URL needs HTTP basic auth.',
			required: false,
		}),
		httpPassword: Property.ShortText({
			displayName: 'HTTP Password',
			description: 'Password if the source URL needs HTTP basic auth.',
			required: false,
		}),
	};
}

function inlineReadProps() {
	return { ...passwordProps(), ...httpAuthProps() };
}

function templateDropdown({ kind, required }: { kind: 'html' | 'documentParser'; required: boolean }) {
	return Property.Dropdown({
		auth: pdfCoAuth,
		displayName: 'Template',
		description:
			kind === 'html'
				? 'An HTML template from PDF.co (app.pdf.co > HTML to PDF Templates). Loading this list costs 2 credits.'
				: 'A Document Parser template from PDF.co (app.pdf.co > Document Parser). Loading this list costs 2 credits.',
		required,
		refreshers: [],
		options: async ({ auth }) => {
			if (auth === undefined) {
				return { disabled: true, options: [], placeholder: 'Connect your PDF.co account first.' };
			}
			try {
				const { templates } = await listTemplates({ apiKey: pdfCoClient.apiKeyOf(auth), kind });
				return {
					disabled: false,
					options: templates.map((template) => ({
						label: `${template.title} (${template.type}, #${template.id})`,
						value: String(template.id),
					})),
				};
			} catch (error) {
				return {
					disabled: true,
					options: [],
					placeholder: error instanceof Error ? error.message : 'Could not load templates.',
				};
			}
		},
	});
}

async function listTemplates({ apiKey, kind }: { apiKey: string; kind: 'html' | 'documentParser' }): Promise<TemplateList> {
	const body = await pdfCoClient.request<unknown>({
		apiKey,
		method: HttpMethod.GET,
		path: kind === 'html' ? '/v1/templates/html' : '/v1/pdf/documentparser/templates',
	});
	const record = pdfCoClient.readRecord(body);
	const raw = record['templates'];
	const templates = (Array.isArray(raw) ? raw : []).map((item) => {
		const template = pdfCoClient.readRecord(item);
		return {
			id: typeof template['id'] === 'number' || typeof template['id'] === 'string' ? template['id'] : '',
			title: typeof template['title'] === 'string' ? template['title'] : 'Untitled',
			type: typeof template['type'] === 'string' ? template['type'] : '',
			description: typeof template['description'] === 'string' ? template['description'] : '',
			sample_data: typeof template['test_json'] === 'string' ? template['test_json'] : undefined,
			updated_at: typeof template['updated_at'] === 'string' ? template['updated_at'] : undefined,
		};
	});
	return {
		templates,
		credits_used: typeof record['credits'] === 'number' ? record['credits'] : undefined,
		remaining_credits: typeof record['remainingCredits'] === 'number' ? record['remainingCredits'] : undefined,
	};
}

function pageLayoutProps() {
	return {
		paperSize: Property.StaticDropdown({
			displayName: 'Paper Size',
			description: 'Standard paper size. For a custom size use Custom Paper Size instead.',
			required: false,
			options: { disabled: false, options: PAPER_SIZES },
		}),
		customPaperSize: Property.ShortText({
			displayName: 'Custom Paper Size',
			description: 'Width and height with units, e.g. "200mm 300mm" or "8.5in 11in". Overrides Paper Size when set.',
			required: false,
		}),
		orientation: Property.StaticDropdown({
			displayName: 'Orientation',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Portrait (default)', value: 'Portrait' },
					{ label: 'Landscape', value: 'Landscape' },
				],
			},
		}),
		margins: Property.ShortText({
			displayName: 'Margins',
			description: 'CSS-style margins: one value for all sides or "top right bottom left", e.g. "10mm" or "5mm 5mm 5mm 5mm".',
			required: false,
		}),
		printBackground: Property.Checkbox({
			displayName: 'Print Background',
			description: 'Include background colors and images.',
			required: false,
			defaultValue: true,
		}),
		header: Property.LongText({
			displayName: 'Header HTML',
			description: 'HTML shown at the top of every page.',
			required: false,
		}),
		footer: Property.LongText({
			displayName: 'Footer HTML',
			description: 'HTML shown at the bottom of every page.',
			required: false,
		}),
	};
}

function pageLayoutBody(values: PageLayoutValues): Record<string, unknown> {
	const custom = typeof values.customPaperSize === 'string' ? values.customPaperSize.trim() : '';
	const paper = custom !== '' ? custom : typeof values.paperSize === 'string' ? values.paperSize : '';
	const orientation = typeof values.orientation === 'string' ? values.orientation : '';
	if (orientation !== '' && orientation !== 'Portrait' && orientation !== 'Landscape') {
		throw new Error('Orientation must be Portrait or Landscape.');
	}
	const text = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value : undefined);
	const margins = text(values.margins);
	const header = text(values.header);
	const footer = text(values.footer);
	return {
		...(paper === '' ? {} : { paperSize: paper }),
		...(orientation === '' ? {} : { orientation }),
		...(margins === undefined ? {} : { margins: margins.trim() }),
		...(typeof values.printBackground === 'boolean' ? { printBackground: values.printBackground } : {}),
		...(header === undefined ? {} : { header }),
		...(footer === undefined ? {} : { footer }),
	};
}

export const commonProps = {
	fileName: Property.ShortText({
		displayName: 'File Name',
		description: 'Desired name for the output PDF file (e.g., "result.pdf").',
		required: false,
	}),
	expiration: Property.Number({
		displayName: 'Expiration Time in Minutes',
		description:
			'Set the expiration time for the output link in minutes (default is 60 i.e 60 minutes or 1 hour).',
		required: false,
	}),
	pdfPassword: Property.ShortText({
		displayName: 'Source PDF Password',
		description: 'Password if the source PDF is protected.',
		required: false,
	}),
	httpUsername: Property.ShortText({
		displayName: 'HTTP Username',
		description: 'HTTP auth username if required to access source url.',
		required: false,
	}),
	httpPassword: Property.ShortText({
		displayName: 'HTTP Password',
		description: 'HTTP auth password if required to access source url.',
		required: false,
	}),
};

export const pdfCoProps = {
	saveOutputFile: saveOutputFileProp,
	sourceUrl: sourceUrlProp,
	sourceFile: sourceFileProp,
	pages: pagesProp,
	output: outputProps,
	password: passwordProps,
	httpAuth: httpAuthProps,
	inlineRead: inlineReadProps,
	runInBackground: runInBackgroundProp,
	templateDropdown,
	listTemplates,
	pageLayout: pageLayoutProps,
	pageLayoutBody,
};

export const PAPER_SIZES = [
	{ label: 'A4 (default)', value: 'A4' },
	{ label: 'Letter', value: 'Letter' },
	{ label: 'Legal', value: 'Legal' },
	{ label: 'Tabloid', value: 'Tabloid' },
	{ label: 'Ledger', value: 'Ledger' },
	{ label: 'A0', value: 'A0' },
	{ label: 'A1', value: 'A1' },
	{ label: 'A2', value: 'A2' },
	{ label: 'A3', value: 'A3' },
	{ label: 'A5', value: 'A5' },
	{ label: 'A6', value: 'A6' },
];

export const BARCODE_TYPES: DropdownOption<string>[] = [
	{ label: 'QR Code (Default)', value: 'QRCode' },
	{ label: 'DataMatrix', value: 'DataMatrix' },
	{ label: 'Code 128', value: 'Code128' },
	{ label: 'Code 39', value: 'Code39' },
	{ label: 'PDF417', value: 'PDF417' },
	{ label: 'EAN-13', value: 'EAN13' },
	{ label: 'UPC-A', value: 'UPCA' },
];

export const PDF_CO_DEFAULTS = {
	saveOutputFileOnNewActions: true,
	saveOutputFileOnExistingActions: false,
};

export const BASE_URL = PDF_CO_BASE_URL;

export type TemplateSummary = {
	id: number | string;
	title: string;
	type: string;
	description: string;
	sample_data?: string;
	updated_at?: string;
};

export type TemplateList = {
	templates: TemplateSummary[];
	credits_used?: number;
	remaining_credits?: number;
};

export type PageLayoutValues = {
	paperSize?: unknown;
	customPaperSize?: unknown;
	orientation?: unknown;
	margins?: unknown;
	printBackground?: unknown;
	header?: unknown;
	footer?: unknown;
};
