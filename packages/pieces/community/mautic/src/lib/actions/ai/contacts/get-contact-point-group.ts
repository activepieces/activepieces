import { createAction } from '@activepieces/pieces-framework';

import { mauticAdjustContactGroupPointsOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticGetContactPointGroupAction = createAction({
	auth: mauticAuth,
	name: 'mautic_get_contact_point_group',
	outputSchema: mauticAdjustContactGroupPointsOutputSchema,
	displayName: 'Get Contact Point Group',
	description: 'Gets the score of a Mautic contact in one point group.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets the contact's score in one point group. The group id comes from List Contact Point Groups. Needs Mautic 5.1 or later.",
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Contact Id',
			description: 'Numeric contact id, from List Contacts or Create Contact.',
		}),
		groupId: mauticAiProps.recordId({
			displayName: 'Point Group Id',
			description: 'Point group id, from List Contact Point Groups.',
		}),
	},
	async run(context) {
		return await mauticApi.getContactPointGroup({
			auth: context.auth,
			id: context.propsValue.id,
			groupId: context.propsValue.groupId,
		});
	},
});
