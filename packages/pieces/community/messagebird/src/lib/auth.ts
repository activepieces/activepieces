import { PieceAuth } from '@activepieces/pieces-framework';

export interface BirdAuthValue {
  apiKey: string;
  workspaceId: string;
  channelId: string;
}

export const birdAuth = PieceAuth.CustomAuth({
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Bird API Access Key from Settings > Security > Access Keys',
      required: true,
    }),
    workspaceId: PieceAuth.SecretText({
      displayName: 'Workspace ID',
      description: 'Bird Workspace ID found in your workspace URL',
      required: true,
    }),
    channelId: PieceAuth.SecretText({
      displayName: 'Channel ID',
      description: 'Your SMS channel ID from Bird dashboard',
      required: true,
    }),
  },
  required: true,
}); 