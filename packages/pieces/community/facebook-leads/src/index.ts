import crypto from 'node:crypto';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { facebookLeadsAiActions } from './lib/actions/ai';
import { facebookLeadsAuth } from './lib/auth';
import { facebookLeadsClient } from './lib/common/client';
import { newLeadTrigger } from './lib/triggers/new-lead';

export const facebookLeads = createPiece({
	displayName: 'Facebook Leads',
	description: 'Capture leads from Facebook',
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/facebook.png',
	authors: ['kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud', 'AbdulTheActivePiecer'],
	categories: [PieceCategory.MARKETING],
	auth: facebookLeadsAuth,
	actions: [
		...facebookLeadsAiActions,
		createCustomApiCallAction({
			auth: facebookLeadsAuth,
			baseUrl: () => facebookLeadsClient.baseUrl(),
			authMapping: async (auth) => ({ Authorization: `Bearer ${auth.access_token}` }),
		}),
	],
	triggers: [newLeadTrigger],
	events: {
		parseAndReply: (context) => {
			const payload = context.payload;
			const payloadBody = payload.body as PayloadBody;
			if (payload.queryParams['hub.verify_token'] == 'activepieces') {
				return {
					reply: {
						body: payload.queryParams['hub.challenge'],
						headers: {},
					},
				};
			}
			return {
				event: 'lead',
				identifierValue: payloadBody.entry[0].changes[0].value.page_id,
			};
		},
		verify: ({ webhookSecret, payload }) => {
			// https://developers.facebook.com/docs/messenger-platform/webhooks#validate-payloads

			const signature = payload.headers['x-hub-signature-256'];
			const elements = signature.split('=');
			const signatureHash = elements[1];

			const hmac = crypto.createHmac('sha256', webhookSecret as string);
			hmac.update(payload.rawBody as any);
			const computedSignature = hmac.digest('hex');

			return signatureHash === computedSignature;
		},
	},
});

type PayloadBody = {
	entry: {
		changes: {
			value: {
				page_id: string;
			};
		}[];
	}[];
};
