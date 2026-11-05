import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

const SORT_OPTIONS = [
	{ label: 'Created (oldest first)', value: 'created_at' },
	{ label: 'Name', value: 'connection_name' },
	{ label: 'Active first', value: 'active' },
];

export const telnyxListCallControlApplicationsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_call_control_applications',
	displayName: 'List Call Control Applications',
	description: 'Lists call control applications.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of call control applications with id, name, active flag, webhook URL and inbound/outbound settings (including the outbound voice profile). Pass an id as Connection ID in Dial Call.',
		idempotent: true,
	},
	props: {
		applicationName: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only return applications whose name contains this text.',
			required: false,
		}),
		outboundVoiceProfileId: Property.ShortText({
			displayName: 'Outbound Voice Profile ID',
			description:
				'Only return items using this outbound voice profile. Use List Outbound Voice Profiles to find it.',
			required: false,
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			description: 'Sort order. Defaults to newest first.',
			required: false,
			options: { disabled: false, options: SORT_OPTIONS },
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listCallControlApplications({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({
					values: {
						'filter[application_name][contains]': p.applicationName,
						'filter[outbound.outbound_voice_profile_id]': p.outboundVoiceProfileId,
					},
				}),
				...telnyxUtils.toQuery({ values: { sort: p.sort } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
