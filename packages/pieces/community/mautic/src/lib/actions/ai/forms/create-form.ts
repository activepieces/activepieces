import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateFormOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticCreateFormAction = createAction({
	auth: mauticAuth,
	name: 'mautic_create_form',
	outputSchema: mauticCreateFormOutputSchema,
	displayName: 'Create Form',
	description: 'Creates a Mautic form.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Creates a form with its fields and submit actions. Name is required.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({ displayName: 'Name', required: true }),
		alias: Property.ShortText({
			displayName: 'Alias',
			description:
				'Form alias; Mautic shortens it to 10 characters and replaces spaces with underscores.',
			required: false,
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		formType: Property.StaticDropdown({
			displayName: 'Form Type',
			description: 'Defaults to standalone.',
			required: false,
			options: {
				options: [
					{ label: 'Standalone', value: 'standalone' },
					{ label: 'Campaign', value: 'campaign' },
				],
			},
		}),
		postAction: Property.StaticDropdown({
			displayName: 'After Submit',
			required: false,
			options: {
				options: [
					{ label: 'Show message', value: 'message' },
					{ label: 'Redirect', value: 'redirect' },
					{ label: 'Return to form', value: 'return' },
				],
			},
		}),
		postActionProperty: Property.ShortText({
			displayName: 'After Submit Value',
			description: 'Message to show or URL to redirect to.',
			required: false,
		}),
		fields: Property.Array({
			displayName: 'Fields',
			description:
				'Form fields, each like {"label": "Email", "type": "email", "alias": "email", "leadField": "email", "isRequired": true}. Include a {"label": "Submit", "type": "button"} field. On update, fields with an "id" are edited and others added.',
			required: false,
		}),
		actions: Property.Array({
			displayName: 'Actions',
			description:
				'Submit actions, each like {"name": "Add to segment", "type": "lead.changelist", "properties": {"addToLists": [1]}}. On update, actions with an "id" are edited and others added.',
			required: false,
		}),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other form properties, e.g. "cachedHtml", "template", "inKioskMode", "renderStyle". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			additionalFields,
			name,
			alias,
			description,
			formType,
			postAction,
			postActionProperty,
			fields,
			actions,
			isPublished,
			category,
		} = context.propsValue;
		return await mauticApi.createRecord({
			auth: context.auth,
			resource: 'forms',
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('alias', alias),
				...spreadIfDefined('description', description),
				...spreadIfDefined('formType', formType),
				...spreadIfDefined('postAction', postAction),
				...spreadIfDefined('postActionProperty', postActionProperty),
				...spreadIfDefined('fields', fields),
				...spreadIfDefined('actions', actions),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
			},
		});
	},
});
