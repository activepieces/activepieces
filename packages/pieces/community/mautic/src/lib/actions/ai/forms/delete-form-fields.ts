import { Property, createAction } from '@activepieces/pieces-framework';

import { mauticDeleteFormActionsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';
import { mauticUtils } from '../../../common/utils';

export const mauticDeleteFormFieldsAction = createAction({
	auth: mauticAuth,
	name: 'mautic_delete_form_fields',
	outputSchema: mauticDeleteFormActionsOutputSchema,
	displayName: 'Delete Form Fields',
	description: 'Removes fields from a Mautic form.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Removes fields from a form by id; past submissions lose those values. Repeating it with the same ids changes nothing. Returns the form.',
		idempotent: true,
	},
	props: {
		formId: mauticAiProps.recordId({
			displayName: 'Form Id',
			description: 'Numeric form id, from List Forms.',
		}),
		ids: Property.Array({
			displayName: 'Field Ids',
			description: 'Field ids to delete, from the fields of Get Form.',
			required: true,
		}),
	},
	async run(context) {
		return await mauticApi.deleteFormItems({
			auth: context.auth,
			formId: context.propsValue.formId,
			kind: 'fields',
			ids: mauticUtils.toBatchIds({ ids: context.propsValue.ids }),
		});
	},
});
