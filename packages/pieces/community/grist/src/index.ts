import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { gristCreateRecordAction } from './lib/actions/create-record.action';

export const gristAuth = PieceAuth.CustomAuth({
	required: true,
	props: {
		apiKey: PieceAuth.SecretText({
			displayName: 'API Key',
			required: true,
		}),
		domain: Property.ShortText({
			displayName: 'Domain',
			required: true,
			defaultValue: 'docs.getgrist.com',
		}),
	},
});

export const grist = createPiece({
	displayName: 'Grist',
	auth: gristAuth,
	minimumSupportedRelease: '0.20.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/grist.png',
	authors: ['kishanprmr'],
	actions: [gristCreateRecordAction],
	triggers: [],
});
