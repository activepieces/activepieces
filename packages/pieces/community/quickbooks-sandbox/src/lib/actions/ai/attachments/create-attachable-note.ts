import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateAttachableNoteOutputSchema } from '../../../output-schemas';

export const createAttachableNoteAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_attachable_note',
	outputSchema: quickbooksSandboxCreateAttachableNoteOutputSchema,
	displayName: 'Create Attachable Note',
	description: 'Adds a text note, optionally attached to a transaction or contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a text-only attachable note, linked to one record when Linked Entity Type and Linked Entity ID are both set (e.g. Invoice and an id from List Invoices). To attach a file, use Upload Attachable instead. Not idempotent: each call creates a new note.',
		idempotent: false,
	},
	props: {
		note: Property.LongText({
			displayName: 'Note',
			description: 'Text of the note.',
			required: true,
		}),
		linkedEntityType: Property.ShortText({
			displayName: 'Linked Entity Type',
			description: 'QuickBooks type of the record to attach the note to, e.g. Invoice, Bill, Purchase, Estimate, Customer or Vendor. Set together with Linked Entity ID.',
			required: false,
		}),
		linkedEntityId: quickbooksAiProps.id({
			required: false,
			displayName: 'Linked Entity ID',
			description: 'Id of the record to attach the note to, from that record\'s List action (e.g. List Invoices). Set together with Linked Entity Type.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Attachable fields, in QuickBooks\' own field names, e.g. {"AttachableRef": [{"EntityRef": {"type": "Invoice", "value": "130"}, "IncludeOnSend": false}, {"EntityRef": {"type": "Customer", "value": "58"}}]} to link several records. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const { note, linkedEntityType, linkedEntityId, additionalFields } = context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Attachable',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						Note: note,
						AttachableRef: quickbooksUtils.attachableRef({ entityType: linkedEntityType, entityId: linkedEntityId }),
					},
				}),
			},
		});
	},
});

