import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFormActionsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticDeleteFormActionsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_form_actions',
	outputSchema: mauticDeleteFormActionsOutputSchema,
	displayName: 'Delete Form Actions',
	description: 'Removes submit actions from a Mautic form.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes submit actions from a form by id. Repeating it with the same ids changes nothing. Returns the form.',
		idempotent: true,
	},
	props: {
		formId: mauticAiProps.recordId({
			displayName: 'Form Id',
			description: 'Numeric form id, from List Forms.',
		}),
		ids: Property.Array({
			displayName: 'Action Ids',
			description: 'Action ids to delete, from the actions of Get Form.',
			required: true,
		}),
	},
	async run(context) {
		return await mauticApi.deleteFormItems({
			auth: context.auth,
			formId: context.propsValue.formId,
			kind: 'actions',
			ids: mauticUtils.toBatchIds({ ids: context.propsValue.ids }),
		});
	},
});
