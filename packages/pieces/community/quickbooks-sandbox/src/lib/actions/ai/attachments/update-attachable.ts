import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateAttachableNoteOutputSchema } from '../../../output-schemas';

export const updateAttachableAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_attachable',
	outputSchema: quickbooksSandboxCreateAttachableNoteOutputSchema,
	displayName: 'Update Attachable',
	description: 'Changes the note, file name or linked record of an attachment or note.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on one attachable and keeps the rest: it reads the current attachable, merges your changes and sends the whole record back. Setting Linked Entity Type and ID replaces all existing links with that one record; pass AttachableRef in Additional Fields to keep several. The file content cannot be changed; upload a new one with Upload Attachable. Get the id from List Attachables.',
		idempotent: true,
	},
	props: {
		attachableId: quickbooksAiProps.id({
			required: true,
			displayName: 'Attachable ID',
			description: 'QuickBooks attachable id. Use List Attachables to find it.',
		}),
		note: Property.LongText({ displayName: 'Note', description: 'New note text.', required: false }),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'New file name, with its extension, for an uploaded file.',
			required: false,
		}),
		linkedEntityType: Property.ShortText({
			displayName: 'Linked Entity Type',
			description: 'QuickBooks type of the record to link to instead of the current links, e.g. Invoice, Bill, Purchase, Customer or Vendor. Set together with Linked Entity ID.',
			required: false,
		}),
		linkedEntityId: quickbooksAiProps.id({
			required: false,
			displayName: 'Linked Entity ID',
			description: 'Id of the record to link to, from that record\'s List action. Set together with Linked Entity Type.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Attachable fields, in QuickBooks\' own field names, e.g. {"AttachableRef": [{"EntityRef": {"type": "Invoice", "value": "130"}, "IncludeOnSend": true}]}. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const { attachableId, note, fileName, linkedEntityType, linkedEntityId, additionalFields } = context.propsValue;
		const changes = quickbooksUtils.requireChanges({
			fields: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Note: note,
						FileName: fileName,
						AttachableRef: quickbooksUtils.attachableRef({ entityType: linkedEntityType, entityId: linkedEntityId }),
					},
				}),
			},
		});
		return await quickbooksApi.replaceEntity({ auth: context.auth, entity: 'Attachable', id: attachableId, fields: changes });
	},
});

