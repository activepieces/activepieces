import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const creditFields: OutputSchemaField[] = [
	{ key: 'credits_used', label: 'Credits Used', format: 'number' },
	{ key: 'remaining_credits', label: 'Remaining Credits', format: 'number' },
];

const fileResultFields: OutputSchemaField[] = [
	{
		key: 'status',
		label: 'Status',
		description: '"success" when the result is ready, "working" when a background job is still running (use Check Job Status with the job ID).',
	},
	{ key: 'job_id', label: 'Job ID', description: 'Only set when Run in Background is on.' },
	{ key: 'url', label: 'Result Link', format: 'url', description: 'Temporary PDF.co link; it expires at Link Valid Until.' },
	{ key: 'name', label: 'File Name' },
	{ key: 'page_count', label: 'Page Count', format: 'number' },
	{ key: 'file_size', label: 'File Size', format: 'filesize', description: 'Only returned by some endpoints.' },
	{
		key: 'credits_used',
		label: 'Credits Used',
		format: 'number',
		description: 'For background jobs this includes the status checks (2 credits per check on most endpoints).',
	},
	{ key: 'remaining_credits', label: 'Remaining Credits', format: 'number' },
	{ key: 'link_valid_until', label: 'Link Valid Until', format: 'datetime' },
	{ key: 'duration_ms', label: 'Duration (ms)', format: 'number' },
	{ key: 'file', label: 'Saved File', description: 'Set when Save Result as File is on.' },
	{ key: 'file_error', label: 'File Save Error', description: 'Why the result could not be saved as a file; the link is still valid.' },
];

const multiFileResultFields: OutputSchemaField[] = [
	...fileResultFields,
	{
		key: 'urls',
		label: 'Result Links',
		description: 'One temporary link per output part or page. Not set when the result is a single file, e.g. a multi-page TIFF.',
	},
	{ key: 'files', label: 'Saved Files', description: 'One file per output part, in the same order as Result Links, when Save Result as File is on. A part that could not be saved is null (see File Save Error).' },
];

const legacyEditFields: OutputSchemaField[] = [
	{ key: 'outputUrl', label: 'Result Link', format: 'url' },
	{ key: 'pageCount', label: 'Page Count', format: 'number' },
	{ key: 'outputName', label: 'File Name' },
	{ key: 'creditsUsed', label: 'Credits Used', format: 'number' },
	{ key: 'remainingCredits', label: 'Remaining Credits', format: 'number' },
	{ key: 'file', label: 'Saved File', description: 'Set when Save Result as File is on.' },
	{ key: 'file_error', label: 'File Save Error' },
];

const rawResultFields: OutputSchemaField[] = [
	{ key: 'url', label: 'Result Link', format: 'url' },
	{ key: 'name', label: 'File Name' },
	{ key: 'pageCount', label: 'Page Count', format: 'number' },
	{ key: 'credits', label: 'Credits Used', format: 'number' },
	{ key: 'remainingCredits', label: 'Remaining Credits', format: 'number' },
	{ key: 'outputLinkValidTill', label: 'Link Valid Until', format: 'datetime' },
	{ key: 'duration', label: 'Duration (ms)', format: 'number' },
	{ key: 'file', label: 'Saved File', description: 'Set when Save Result as File is on.' },
	{ key: 'file_error', label: 'File Save Error' },
];

const pdfInfoFields: OutputSchemaField[] = [
	{ key: 'page_count', label: 'Page Count', format: 'number' },
	{ key: 'title', label: 'Title' },
	{ key: 'author', label: 'Author' },
	{ key: 'subject', label: 'Subject' },
	{ key: 'keywords', label: 'Keywords' },
	{ key: 'creator', label: 'Creator' },
	{ key: 'producer', label: 'Producer' },
	{ key: 'creation_date', label: 'Created', description: 'As PDF.co reports it, e.g. "2001-08-15T14:50:36".' },
	{ key: 'modification_date', label: 'Modified' },
	{ key: 'page_width', label: 'Page Width (pt)', format: 'number' },
	{ key: 'page_height', label: 'Page Height (pt)', format: 'number' },
	{ key: 'encrypted', label: 'Encrypted', format: 'boolean' },
	{ key: 'password_protected', label: 'Password Protected', format: 'boolean' },
	{ key: 'encryption_algorithm', label: 'Encryption Algorithm' },
	{ key: 'permission_printing', label: 'Can Print', format: 'boolean' },
	{ key: 'permission_modify_document', label: 'Can Modify', format: 'boolean' },
	{ key: 'permission_content_extraction', label: 'Can Copy Content', format: 'boolean' },
	{ key: 'permission_modify_annotations', label: 'Can Annotate', format: 'boolean' },
	{ key: 'permission_fill_forms', label: 'Can Fill Forms', format: 'boolean' },
	{ key: 'permission_assemble', label: 'Can Assemble', format: 'boolean' },
	...creditFields,
];

const templateFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Template ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'description', label: 'Description' },
	{ key: 'type', label: 'Type', description: '"system" (built in) or "user" (yours).' },
];

export const pdfCoOutputSchemas = {
	fileResult: { fields: fileResultFields } satisfies OutputSchema,
	multiFileResult: { fields: multiFileResultFields } satisfies OutputSchema,
	legacyEdit: { fields: legacyEditFields } satisfies OutputSchema,
	rawResult: { fields: rawResultFields } satisfies OutputSchema,
	extractText: {
		fields: [
			{ key: 'extractedText', label: 'Extracted Text' },
			{ key: 'pageCount', label: 'Page Count', format: 'number' },
			{ key: 'outputName', label: 'File Name' },
			{ key: 'creditsUsed', label: 'Credits Used', format: 'number' },
			{ key: 'remainingCredits', label: 'Remaining Credits', format: 'number' },
		],
	} satisfies OutputSchema,
	extractTables: {
		fields: [
			{
				key: 'extractedTables',
				label: 'Tables',
				labelKey: 'name',
				listItems: [
					{ key: 'name', label: 'Table Name' },
					{ key: 'objectType', label: 'Object Type' },
					{ key: 'pageIndex', label: 'Page (0-based)', format: 'number', description: 'Often not set on the table; each cell in Rows carries its own pageIndex.' },
					{ key: 'rows', label: 'Rows' },
				],
			},
			{ key: 'templateNameUsed', label: 'Template Name' },
		],
	} satisfies OutputSchema,
	creditBalance: { fields: [{ key: 'remaining_credits', label: 'Remaining Credits', format: 'number' }] } satisfies OutputSchema,
	pdfInfo: { fields: pdfInfoFields } satisfies OutputSchema,
	formFields: {
		fields: [
			{ key: 'page_count', label: 'Page Count', format: 'number' },
			{ key: 'field_count', label: 'Field Count', format: 'number' },
			{
				key: 'fields',
				label: 'Form Fields',
				labelKey: 'field_name',
				listItems: [
					{ key: 'field_name', label: 'Field Name', description: 'Use this exact name in Fill PDF Form.' },
					{ key: 'type', label: 'Type' },
					{ key: 'value', label: 'Current Value' },
					{ key: 'page_index', label: 'Page (0-based)', format: 'number' },
					{ key: 'left', label: 'Left', format: 'number' },
					{ key: 'top', label: 'Top', format: 'number' },
					{ key: 'width', label: 'Width', format: 'number' },
					{ key: 'height', label: 'Height', format: 'number' },
				],
			},
			...creditFields,
		],
	} satisfies OutputSchema,
	findText: {
		fields: [
			{ key: 'match_count', label: 'Matches Found', format: 'number' },
			{
				key: 'matches',
				label: 'Matches',
				labelKey: 'text',
				listItems: [
					{ key: 'text', label: 'Text' },
					{ key: 'page_index', label: 'Page (0-based)', format: 'number' },
					{ key: 'left', label: 'Left', format: 'number' },
					{ key: 'top', label: 'Top', format: 'number' },
					{ key: 'width', label: 'Width', format: 'number' },
					{ key: 'height', label: 'Height', format: 'number' },
				],
			},
			{ key: 'page_count', label: 'Pages Searched', format: 'number' },
			...creditFields,
		],
	} satisfies OutputSchema,
	readBarcodes: {
		fields: [
			{ key: 'barcode_count', label: 'Barcodes Found', format: 'number' },
			{
				key: 'barcodes',
				label: 'Barcodes',
				labelKey: 'value',
				listItems: [
					{ key: 'value', label: 'Value' },
					{ key: 'type', label: 'Type', description: 'PDF.co type name, e.g. "QRCode", "Code128", "EAN13"; Interleaved 2 of 5 comes back as "I2of5".' },
					{ key: 'page', label: 'Page (0-based)', format: 'number' },
					{ key: 'rect', label: 'Position', description: 'For example "{X=448,Y=23,Width=106,Height=112}".' },
					{ key: 'confidence', label: 'Confidence', format: 'number' },
				],
			},
			{ key: 'page_count', label: 'Page Count', format: 'number' },
			...creditFields,
		],
	} satisfies OutputSchema,
	templates: {
		fields: [
			{ key: 'template_count', label: 'Template Count', format: 'number' },
			{ key: 'templates', label: 'Templates', labelKey: 'title', listItems: templateFields },
			...creditFields,
		],
	} satisfies OutputSchema,
	htmlTemplates: {
		fields: [
			{ key: 'template_count', label: 'Template Count', format: 'number' },
			{
				key: 'templates',
				label: 'Templates',
				labelKey: 'title',
				listItems: [
					...templateFields,
					{ key: 'sample_data', label: 'Sample Data (JSON)' },
					{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
				],
			},
			...creditFields,
		],
	} satisfies OutputSchema,
	parseDocument: {
		fields: [
			{ key: 'template_name', label: 'Template Name' },
			{ key: 'fields', label: 'Fields', description: 'Each field name defined in the template mapped to its value.' },
			{
				key: 'tables',
				label: 'Tables',
				labelKey: 'name',
				listItems: [
					{ key: 'name', label: 'Table Name' },
					{ key: 'page_index', label: 'Page (0-based)', format: 'number', description: 'Page of the first table cell.' },
					{ key: 'rows', label: 'Rows', description: 'Each row maps column1, column2… to { value, pageIndex }.' },
				],
			},
			{ key: 'page_count', label: 'Page Count', format: 'number' },
			...creditFields,
		],
	} satisfies OutputSchema,
	invoice: {
		fields: [
			{ key: 'status', label: 'Status', description: '"success", or "working" if the job is still running (run this action again with the Job ID).' },
			{ key: 'job_id', label: 'Job ID' },
			{ key: 'vendor_name', label: 'Vendor Name' },
			{ key: 'customer_name', label: 'Bill-To Name' },
			{ key: 'invoice_number', label: 'Invoice Number' },
			{ key: 'invoice_date', label: 'Invoice Date' },
			{ key: 'due_date', label: 'Due Date' },
			{ key: 'po_number', label: 'PO Number' },
			{ key: 'total', label: 'Total' },
			{ key: 'subtotal', label: 'Subtotal' },
			{ key: 'tax', label: 'Tax' },
			{ key: 'line_items', label: 'Line Items', description: 'Rows as PDF.co returns them; the keys vary by invoice unless Line Item Structure is set.' },
			{ key: 'invoice', label: 'Full Invoice Data', description: 'The complete parsed invoice (vendor, customer, invoice, paymentDetails, lineItems).' },
			{ key: 'page_count', label: 'Page Count', format: 'number' },
			...creditFields,
		],
	} satisfies OutputSchema,
	upload: {
		fields: [
			{ key: 'url', label: 'File URL', format: 'url', description: 'Use this as the source URL in other PDF.co actions. Kept for 1 hour.' },
			{ key: 'name', label: 'File Name' },
			{ key: 'link_valid_until', label: 'Link Valid Until', format: 'datetime' },
			...creditFields,
		],
	} satisfies OutputSchema,
	jobStatus: {
		fields: [
			{ key: 'job_id', label: 'Job ID' },
			{ key: 'status', label: 'Status', description: 'working, success, failed or aborted.' },
			{ key: 'message', label: 'Message' },
			{ key: 'url', label: 'Result Link', format: 'url', description: 'For split jobs this is a JSON file listing the part links (see Result Links).' },
			{ key: 'urls', label: 'Result Links', description: 'One link per part, for jobs with several outputs such as Split PDF.' },
			{ key: 'page_count', label: 'Page Count', format: 'number' },
			{ key: 'link_valid_until', label: 'Link Valid Until', format: 'datetime' },
			...creditFields,
			{ key: 'file', label: 'Saved File', description: 'The first part when the job has several outputs; not set if that part could not be saved.' },
			{ key: 'files', label: 'Saved Files', description: 'One file per part, in the same order as Result Links, for jobs with several outputs. A part that could not be saved is null (see File Save Error).' },
			{ key: 'file_error', label: 'File Save Error' },
		],
	} satisfies OutputSchema,
	aiConvert: {
		fields: [
			{ key: 'format', label: 'Format' },
			{ key: 'content', label: 'Content', description: 'The converted content, cut to max_chars.' },
			{ key: 'truncated', label: 'Truncated', format: 'boolean' },
			{ key: 'total_chars', label: 'Total Characters', format: 'number' },
			{ key: 'page_count', label: 'Page Count', format: 'number' },
			...creditFields,
		],
	} satisfies OutputSchema,
};
