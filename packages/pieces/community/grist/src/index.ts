import {
	createPiece,
	PieceAuth,
	PiecePropValueSchema,
	Property,
} from '@activepieces/pieces-framework';
import { gristCreateRecordAction } from './lib/actions/create-record.action';
import { gristUpdateRecordAction } from './lib/actions/update-record.action';
import { gristUploadAttachmentsToDocumnetAction } from './lib/actions/upload-attachments-to-document.action';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

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
	actions: [
		gristCreateRecordAction,
		gristUpdateRecordAction,
		gristUploadAttachmentsToDocumnetAction,
		createCustomApiCallAction({
			auth: gristAuth,
			baseUrl: (auth) => {
				return `https://(${(auth as PiecePropValueSchema<typeof gristAuth>).domain})/api/`;
			},
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as PiecePropValueSchema<typeof gristAuth>).apiKey}`,
			}),
		}),
	],
	triggers: [],
});
