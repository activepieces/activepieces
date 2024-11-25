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
import { gristSearchRecordAction } from './lib/actions/search-record.action';
import { GristAPIClient } from './lib/common/helpers';
import { PieceCategory } from '@activepieces/shared';

export const gristAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
	Log in to your Grist account.avigate to the account menu at the top right, and select **Profile Settings** to manage or create your API Key.
	In the **Domain URL** field, enter the domain URL of your Grist instance.For example,if you have team site it will be "https://team.getgist.com".`,
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
  validate: async ({ auth }) => {
    try {
      const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

      const client = new GristAPIClient({
        domainUrl: authValue.domain,
        apiKey: authValue.apiKey,
      });

      await client.listWorkspaces('current');

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Please provide valid API key and domain URL.',
      };
    }
  },
});

export const grist = createPiece({
  displayName: 'Grist',
  auth: gristAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/grist.png',
  description: 'open source spreadsheet',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['kishanprmr'],
  actions: [
    gristCreateRecordAction,
    gristSearchRecordAction,
    gristUpdateRecordAction,
    gristUploadAttachmentsToDocumnetAction,
    createCustomApiCallAction({
      auth: gristAuth,
      baseUrl: (auth) => {
        return `${
          (auth as PiecePropValueSchema<typeof gristAuth>).domain
        }/api/`;
      },
      authMapping: async (auth) => ({
        Authorization: `Bearer ${
          (auth as PiecePropValueSchema<typeof gristAuth>).apiKey
        }`,
      }),
    }),
  ],
  triggers: [gristNewRecordTrigger, gristUpdatedRecordTrigger],
});
