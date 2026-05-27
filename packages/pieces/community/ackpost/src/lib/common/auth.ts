import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const ackpostAuth = PieceAuth.CustomAuth({
  description: 'Create an API key in AckPost at Settings > Developer.',
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your AckPost API key',
      required: true,
    }),
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      description: 'Your AckPost workspace ID. Find it in Settings > Workspace.',
      required: true,
    }),
  },
});
