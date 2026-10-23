import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListAutoResponsesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_auto_responses',
	displayName: 'List Auto-Responses',
	description: 'Lists the keyword auto-responses of a messaging profile.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the opt-in, opt-out and help keyword auto-responses configured on a messaging profile, optionally for one country.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description: 'Only return settings for this ISO 3166-1 alpha-2 country, e.g. "US".',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listAutoResponses({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			query: telnyxUtils.toQuery({ values: { country_code: p.countryCode } }),
		});
	},
});
