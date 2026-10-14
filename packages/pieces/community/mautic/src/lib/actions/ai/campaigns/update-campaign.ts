import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticGetCampaignOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateCampaignAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_campaign',
	outputSchema: mauticGetCampaignOutputSchema,
	displayName: 'Update Campaign',
	description: 'Updates fields of a Mautic campaign.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an existing campaign, e.g. to publish or unpublish it. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Campaign Id',
			description: 'Numeric campaign id, from List Campaigns or Create Campaign.',
		}),
		name: Property.ShortText({ displayName: 'Name', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		category: Property.Number({
			displayName: 'Category Id',
			description: 'Category id, from List Categories.',
			required: false,
		}),
		allowRestart: mauticAiProps.yesNo({
			displayName: 'Allow Restart',
			description: 'Whether contacts can go through the campaign more than once.',
		}),
		publishUp: Property.ShortText({
			displayName: 'Publish Up',
			description: 'Start date/time, e.g. "2026-01-01 09:00:00".',
			required: false,
		}),
		publishDown: Property.ShortText({
			displayName: 'Publish Down',
			description: 'End date/time, e.g. "2026-12-31 18:00:00".',
			required: false,
		}),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other campaign properties, such as "events", "lists" (segment ids as [{"id": 1}]), "forms" and "canvasSettings", in the shape Get Campaign returns. The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const {
			id,
			additionalFields,
			name,
			description,
			isPublished,
			category,
			allowRestart,
			publishUp,
			publishDown,
		} = context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'campaigns',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('name', name),
				...spreadIfDefined('description', description),
				...spreadIfDefined('isPublished', isPublished),
				...spreadIfDefined('category', category),
				...spreadIfDefined('allowRestart', allowRestart),
				...spreadIfDefined('publishUp', publishUp),
				...spreadIfDefined('publishDown', publishDown),
			},
		});
	},
});
