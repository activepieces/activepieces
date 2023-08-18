import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { publishToTopic } from './lib/action/publish-to-topic';
import { common } from './lib/common';
import { newMessageInTopic } from './lib/trigger/new-message-in-topic';

export const googlePubsubAuth = PieceAuth.CustomAuth({
  description: '',
  required: true,
  props: {
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Service email',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      required: true,
    }),
  },
  validate: async ({auth}) => {
    try {
      const client = common.getClient(auth);
      await client.request({ url: `https://pubsub.googleapis.com/v1/projects/${auth.projectId}/topics` });
      return {
        valid: true,
      };
    } catch (e: any) {
      if ('response' in e) {
        console.debug(`Auth Gcloud pubsub status: ${e.response.status}, data: ${JSON.stringify(e.response.data)}`);
      }
      return {
        valid: false,
        error: 'Connection failed. Please check your Private Key, Email or Project ID.',
      };
    }
  },
})

export const gcloudPubsub = createPiece({
  displayName: "Gcloud-pubsub",
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/github.png', // FIXME: change image
  auth: googlePubsubAuth,
  authors: ['kidskey'],
  actions: [publishToTopic],
  triggers: [newMessageInTopic],
});
