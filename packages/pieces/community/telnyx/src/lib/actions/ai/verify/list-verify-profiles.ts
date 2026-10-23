import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListVerifyProfilesAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_verify_profiles',
	displayName: 'List Verify Profiles',
	description: 'Lists Verify profiles.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of Verify profiles with their id, name, language and the SMS, call and flash call settings. Use it to find the Verify Profile ID that the send and check verification actions need.',
		idempotent: true,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Only return profiles with this exact name.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listVerifyProfiles({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({ filters: { name: p.name } }),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
