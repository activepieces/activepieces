import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const mergePdfs = createAction({
	auth: pdfCoAuth,
	name: 'merge_pdfs',
	displayName: 'Merge PDFs',
	description: 'Combine two or more PDFs into one PDF, in the order given.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Merges two or more PDFs, given as public URLs and/or files, into one new PDF in the order listed (URLs first, then files) and returns a temporary link, optionally saving the file. Use to combine documents; convert Word, Excel or images to PDF first. Costs 2 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrls: Property.Array({
			displayName: 'PDF URLs',
			description: 'Public links to the PDFs, in merge order. These come before any files below.',
			required: false,
		}),
		sourceFiles: Property.Array({
			displayName: 'PDF Files',
			description: 'PDFs from earlier steps, merged after the URLs. Each file is uploaded to PDF.co first (7 credits each).',
			required: false,
			properties: {
				file: Property.File({ displayName: 'PDF File', required: true }),
			},
		}),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const urls = listOfUrls(propsValue.sourceUrls);
		const fileItems = listOfFiles(propsValue.sourceFiles);
		if (urls.length + fileItems.length < 2) {
			throw new Error('Give at least two PDFs to merge (URLs, files, or both).');
		}
		urls.forEach((url, index) => pdfCoFiles.validateSource({ url, file: undefined, label: `PDF URL #${index + 1}` }));
		const uploaded: string[] = [];
		for (const file of fileItems) {
			uploaded.push(await pdfCoFiles.uploadFile({ apiKey, file }));
		}
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/merge',
			body: { url: [...urls.map((url) => url.trim()), ...uploaded].join(',') },
			common: propsValue,
		});
	},
});

function listOfUrls(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map((item) => (typeof item === 'string' ? item : String(item ?? ''))).filter((item) => item.trim() !== '');
}

function listOfFiles(value: unknown): unknown[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map((item, index) => {
		const file = pdfCoClient.readRecord(item)['file'];
		if (!pdfCoFiles.isFileLike(file)) {
			throw new Error(`PDF File #${index + 1} could not be read. Pick a file from an earlier step.`);
		}
		return file;
	});
}
