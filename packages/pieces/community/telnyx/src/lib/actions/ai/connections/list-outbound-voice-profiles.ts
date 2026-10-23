import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListOutboundVoiceProfilesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_outbound_voice_profiles',
	displayName: 'List Outbound Voice Profiles',
	description: 'Lists outbound voice profiles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of outbound voice profiles (billing and routing for outbound calls) with id, name, enabled flag, traffic type, allowed destinations and spend limits. A call control application needs one before Dial Call can reach phone numbers; pass its id as Outbound Voice Profile ID in Create Call Control Application.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return profiles whose name contains this text.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listOutboundVoiceProfiles({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({ values: { 'filter[name][contains]': p.name } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
