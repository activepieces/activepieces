import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksClient } from '../../../common/client';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUploadAttachableOutputSchema } from '../../../output-schemas';

export const uploadAttachableAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_upload_attachable',
	outputSchema: quickbooksSandboxUploadAttachableOutputSchema,
	displayName: 'Upload Attachable',
	description: 'Uploads a file, optionally attached to a transaction or contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads one file (receipt, contract, image) to QuickBooks as an attachable, linked to one record when Linked Entity Type and Linked Entity ID are both set (e.g. Bill and an id from List Bills). For a text-only note, use Create Attachable Note. Not idempotent: each call uploads another copy.',
		idempotent: false,
	},
	props: {
		file: Property.File({
			displayName: 'File',
			description: 'The file to upload. QuickBooks accepts common document and image types such as PDF, JPEG, PNG, DOCX, XLSX, CSV and TXT.',
			required: true,
		}),
		contentType: Property.ShortText({
			displayName: 'Content Type',
			description: 'MIME type of the file, e.g. application/pdf, image/jpeg, image/png or text/plain.',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'File name with its extension, as shown in QuickBooks. Defaults to the uploaded file\'s name.',
			required: false,
		}),
		note: Property.LongText({
			displayName: 'Note',
			description: 'Note stored with the file.',
			required: false,
		}),
		linkedEntityType: Property.ShortText({
			displayName: 'Linked Entity Type',
			description: 'QuickBooks type of the record to attach the file to, e.g. Invoice, Bill, Purchase, Estimate, Customer or Vendor. Set together with Linked Entity ID.',
			required: false,
		}),
		linkedEntityId: quickbooksAiProps.id({
			required: false,
			displayName: 'Linked Entity ID',
			description: 'Id of the record to attach the file to, from that record\'s List action (e.g. List Bills). Set together with Linked Entity Type.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Attachable metadata fields, in QuickBooks\' own field names, e.g. {"AttachableRef": [{"EntityRef": {"type": "Invoice", "value": "130"}, "IncludeOnSend": true}]} to link several records or send the file with the invoice. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const { file, contentType, fileName, note, linkedEntityType, linkedEntityId, additionalFields } = context.propsValue;
		const name = fileName || file.filename;
		const metadata = {
			...additionalFields,
			...quickbooksUtils.compact({
				fields: {
					FileName: name,
					ContentType: contentType,
					Note: note,
					AttachableRef: quickbooksUtils.attachableRef({ entityType: linkedEntityType, entityId: linkedEntityId }),
				},
			}),
		};
		const form = new FormData();
		form.append('file_metadata_0', new Blob([JSON.stringify(metadata)], { type: 'application/json' }), 'metadata.json');
		form.append('file_content_0', new Blob([file.data], { type: contentType }), name);
		const response = await quickbooksClient.request<QuickbooksUploadResponse>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/upload',
			body: form,
		});
		const fault = response.AttachableResponse?.find((entry) => entry.Fault)?.Fault;
		if (fault) {
			throw new Error(
				`QuickBooks rejected the upload: ${fault.Error?.map((error) => error.Detail ?? error.Message).join('; ') ?? 'unknown error'}`,
			);
		}
		return response;
	},
});


type QuickbooksUploadResponse = {
	AttachableResponse?: {
		Attachable?: Record<string, unknown>;
		Fault?: { Error?: { Message?: string; Detail?: string; code?: string }[]; type?: string };
	}[];
	time?: string;
};
