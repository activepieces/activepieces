import { createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const getPdfInfo = createAction({
	auth: pdfCoAuth,
	name: 'get_pdf_info',
	displayName: 'Get PDF Info',
	description: 'Read a PDF\'s page count, metadata, page size and security settings.',
	audience: 'both',
	classification: 'READ',
	aiMetadata: {
		description:
			'Reads a PDF\'s metadata (public URL or file): page count, title, author, dates, page size, encryption and permission flags. Use to check the page count or protection before other steps. Costs 7 credits per page. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.pdfInfo,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		...pdfCoProps.inlineRead(),
	},
	async run({ auth, propsValue }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		const body = await pdfCoJobs.runInline({ apiKey, path: '/v1/pdf/info', body: { url }, common: propsValue });
		return flattenPdfInfo(body);
	},
});

export function flattenPdfInfo(body: Record<string, unknown>): Record<string, unknown> {
	const info = pdfCoClient.readRecord(body['info']);
	const rect = pdfCoClient.readRecord(info['PageRectangle']);
	return {
		page_count: info['PageCount'],
		title: info['Title'],
		author: info['Author'],
		subject: info['Subject'],
		keywords: info['Keywords'],
		creator: info['Creator'],
		producer: info['Producer'],
		creation_date: info['CreationDate'],
		modification_date: info['ModificationDate'],
		page_width: rect['Width'],
		page_height: rect['Height'],
		encrypted: info['Encrypted'],
		password_protected: info['PasswordProtected'],
		encryption_algorithm: info['EncryptionAlgorithm'],
		permission_printing: info['PermissionPrinting'],
		permission_modify_document: info['PermissionModifyDocument'],
		permission_content_extraction: info['PermissionContentExtraction'],
		permission_modify_annotations: info['PermissionModifyAnnotations'],
		permission_fill_forms: info['PermissionFillForms'],
		permission_assemble: info['PermissionAssemble'],
		credits_used: body['credits'],
		remaining_credits: body['remainingCredits'],
	};
}
