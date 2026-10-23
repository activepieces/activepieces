import { createAction } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';

export const telnyxGetConnectionAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_get_connection',
	displayName: 'Get Connection',
	description: 'Gets a voice connection.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one voice connection of any type by id: name, active flag, webhook URLs, outbound voice profile and tags. Use List Connections to find the id.',
		idempotent: true,
	},
	props: {
		connectionId: telnyxAiProps.connectionId({ required: true }),
	},
	async run(context) {
		return await telnyxApi.getConnection({
			auth: context.auth,
			connectionId: context.propsValue.connectionId,
		});
	},
});
