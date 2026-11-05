import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListFaxApplicationsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_fax_applications',
	displayName: 'List Fax Applications',
	description: 'Lists fax applications.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of fax applications with id, name, active flag, webhook URL and outbound settings. Pass an id as the connection id of Send Fax.',
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
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listFaxApplications({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({
					values: {
						'filter[application_name][contains]': p.applicationName,
						'filter[outbound_voice_profile_id]': p.outboundVoiceProfileId,
					},
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
