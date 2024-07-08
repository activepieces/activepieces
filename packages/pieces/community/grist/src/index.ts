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
import { gristNewRecordTrigger } from './lib/triggers/new-record.trigger';
import { gristUpdatedRecordTrigger } from './lib/triggers/updated-record.trigger';

export const gristAuth = PieceAuth.CustomAuth({
	required: true,
	description: `
	1.Log in to your Grist account.avigate to the account menu at the top right, and select **Profile Settings** to manage or create your API Key.
	2.In the Domain URL field, enter the domain URL of your Grist instance.For example,if you have team site it will be "https://team.getgist.com".`,
	props: {
		apiKey: PieceAuth.SecretText({
			displayName: 'API Key',
			required: true,
		}),
		domain: Property.ShortText({
			displayName: 'Domain URL',
			required: true,
			defaultValue: 'https://docs.getgrist.com',
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
				return `${(auth as PiecePropValueSchema<typeof gristAuth>).domain}/api/`;
			},
			authMapping: async (auth) => ({
				Authorization: `Bearer ${(auth as PiecePropValueSchema<typeof gristAuth>).apiKey}`,
			}),
		}),
	],
	triggers: [gristNewRecordTrigger, gristUpdatedRecordTrigger],
});
