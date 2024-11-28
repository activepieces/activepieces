import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { publishToTopic } from './lib/action/publish-to-topic';
import { common } from './lib/common';
import { newMessageInTopic } from './lib/trigger/new-message-in-topic';

const authDescription = `
You can get it from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials/serviceaccountkey).
`;

export const googlePubsubAuth = PieceAuth.CustomAuth({
  description: authDescription,
  required: true,
  props: {
    json: Property.LongText({
      displayName: 'Service Key (JSON)',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = common.getClient(auth.json);
      await client.request({
        url: `https://pubsub.googleapis.com/v1/projects/${common.getProjectId(
          auth.json
        )}/topics`,
      });
      return {
        valid: true,
      };
    } catch (e: any) {
      if ('response' in e) {
        console.debug(
          `Auth Gcloud pubsub status: ${
            e.response.status
          }, data: ${JSON.stringify(e.response.data)}`
        );
      }
      return {
        valid: false,
        error:
          'Connection failed. Please check your Private Key, Email or Project ID.',
      };
    }
  },
});

export const gcloudPubsub = createPiece({
  displayName: 'GCloud Pub/Sub',
  description: "Google Cloud's event streaming service",

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/gcloud-pubsub.png',
  categories: [PieceCategory.DEVELOPER_TOOLS],
  auth: googlePubsubAuth,
  authors: ["DGurskij","kishanprmr","khaledmashaly","abuaboud"],
  actions: [publishToTopic],
  triggers: [newMessageInTopic],
});
