import { createAction, Property } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { clockifyUtils } from '../../common/utils';
import { customFieldsOutputSchema } from '../../output-schemas';

export const listCustomFieldsAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_list_custom_fields',
	outputSchema: customFieldsOutputSchema,
	displayName: 'List Custom Fields',
	description: 'Lists the custom fields of a workspace.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the custom fields defined in a workspace with their IDs, types, allowed values and defaults, optionally filtered by name, status or entity type (TIMEENTRY or USER). Needs a Clockify plan with custom fields (Pro or higher).',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Optional: only fields whose name contains this text.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Visible', value: 'VISIBLE' },
					{ label: 'Invisible', value: 'INVISIBLE' },
					{ label: 'Inactive', value: 'INACTIVE' },
				],
			},
		}),
		entityType: Property.StaticDropdown({
			displayName: 'Applies To',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Time entries', value: 'TIMEENTRY' },
					{ label: 'Users', value: 'USER' },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const customFields = await clockifyApi.listCustomFields({
			auth,
			workspaceId: propsValue.workspaceId,
			query: clockifyUtils.toQuery({
				params: {
					name: propsValue.name,
					status: propsValue.status,
					'entity-type': propsValue.entityType,
				},
			}),
		});
		return { customFields, count: customFields.length };
	},
});
