import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

const ALGORITHMS = ['AES_128bit', 'AES_256bit', 'RC4_40bit', 'RC4_128bit'];

export const addPasswordToPdf = createAction({
	auth: pdfCoAuth,
	name: 'add_password_to_pdf',
	displayName: 'Protect PDF with Password',
	description: 'Create a password-protected copy of a PDF and choose what readers may do.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a password-protected copy of a PDF (public URL or file) with an owner password, an optional password to open it, and permission flags (print, copy, edit, fill forms, annotate, assemble). Costs 3 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		ownerPassword: Property.ShortText({
			displayName: 'Owner Password',
			description: 'Password that allows changing the security settings.',
			required: true,
		}),
		userPassword: Property.ShortText({
			displayName: 'Open Password',
			description: 'Password readers need to open the PDF. Leave empty to let anyone open it with the permissions below.',
			required: false,
		}),
		encryptionAlgorithm: Property.StaticDropdown({
			displayName: 'Encryption',
			required: false,
			defaultValue: 'AES_128bit',
			options: {
				disabled: false,
				options: [
					{ label: 'AES 128-bit (default)', value: 'AES_128bit' },
					{ label: 'AES 256-bit', value: 'AES_256bit' },
					{ label: 'RC4 40-bit (legacy)', value: 'RC4_40bit' },
					{ label: 'RC4 128-bit (legacy)', value: 'RC4_128bit' },
				],
			},
		}),
		permissionsInfo: Property.MarkDown({ value: 'Permissions are off by default, as in PDF.co. Turn on what readers of the protected PDF may do.' }),
		allowPrintDocument: Property.Checkbox({ displayName: 'Allow Printing', required: false, defaultValue: false }),
		allowContentExtraction: Property.Checkbox({ displayName: 'Allow Copying Content', required: false, defaultValue: false }),
		allowModifyDocument: Property.Checkbox({ displayName: 'Allow Editing', required: false, defaultValue: false }),
		allowFillForms: Property.Checkbox({ displayName: 'Allow Filling Forms', required: false, defaultValue: false }),
		allowModifyAnnotations: Property.Checkbox({ displayName: 'Allow Annotations', required: false, defaultValue: false }),
		allowAssemblyDocument: Property.Checkbox({ displayName: 'Allow Assembling Pages', required: false, defaultValue: false }),
		allowAccessibilitySupport: Property.Checkbox({ displayName: 'Allow Accessibility Tools', required: false, defaultValue: false }),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const ownerPassword = propsValue.ownerPassword;
		if (ownerPassword.trim() === '') {
			throw new Error('Owner Password is required.');
		}
		const algorithm = pdfCoFiles.nonEmptyString(propsValue.encryptionAlgorithm);
		if (algorithm !== undefined && !ALGORITHMS.includes(algorithm)) {
			throw new Error(`Encryption must be one of ${ALGORITHMS.join(', ')}.`);
		}
		const userPassword = pdfCoFiles.nonEmptyString(propsValue.userPassword);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/security/add',
			body: {
				url,
				ownerPassword,
				...(userPassword === undefined ? {} : { userPassword }),
				...(algorithm === undefined ? {} : { encryptionAlgorithm: algorithm }),
				allowPrintDocument: propsValue.allowPrintDocument === true,
				allowContentExtraction: propsValue.allowContentExtraction === true,
				allowModifyDocument: propsValue.allowModifyDocument === true,
				allowFillForms: propsValue.allowFillForms === true,
				allowModifyAnnotations: propsValue.allowModifyAnnotations === true,
				allowAssemblyDocument: propsValue.allowAssemblyDocument === true,
				allowAccessibilitySupport: propsValue.allowAccessibilitySupport === true,
			},
			common: propsValue,
		});
	},
});
