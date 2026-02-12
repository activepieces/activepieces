import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { sendPrompt } from './lib/actions/send-prompt';
import { generateContentFromImage } from './lib/actions/generate-content-from-image';
import { generateContentFromFile } from './lib/actions/generate-content-from-file';
import { invokeModel } from './lib/actions/invoke-model';
import { generateImage } from './lib/actions/generate-image';
import { generateEmbeddings } from './lib/actions/generate-embeddings';
import { createBedrockClient } from './lib/common';

export const awsBedrockAuth = PieceAuth.CustomAuth({
  description: 'AWS Bedrock authentication using Access Key and Secret Key.',
  props: {
    accessKeyId: Property.ShortText({
      displayName: 'Access Key ID',
      required: true,
    }),
    secretAccessKey: PieceAuth.SecretText({
      displayName: 'Secret Access Key',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      options: {
        options: [
          { label: 'US East (N. Virginia) [us-east-1]', value: 'us-east-1' },
          { label: 'US East (Ohio) [us-east-2]', value: 'us-east-2' },
          { label: 'US West (Oregon) [us-west-2]', value: 'us-west-2' },
          {
            label: 'Asia Pacific (Mumbai) [ap-south-1]',
            value: 'ap-south-1',
          },
          {
            label: 'Asia Pacific (Singapore) [ap-southeast-1]',
            value: 'ap-southeast-1',
          },
          {
            label: 'Asia Pacific (Sydney) [ap-southeast-2]',
            value: 'ap-southeast-2',
          },
          {
            label: 'Asia Pacific (Tokyo) [ap-northeast-1]',
            value: 'ap-northeast-1',
          },
          {
            label: 'Canada (Central) [ca-central-1]',
            value: 'ca-central-1',
          },
          {
            label: 'Europe (Frankfurt) [eu-central-1]',
            value: 'eu-central-1',
          },
          { label: 'Europe (Ireland) [eu-west-1]', value: 'eu-west-1' },
          { label: 'Europe (London) [eu-west-2]', value: 'eu-west-2' },
          { label: 'Europe (Paris) [eu-west-3]', value: 'eu-west-3' },
          {
            label: 'South America (São Paulo) [sa-east-1]',
            value: 'sa-east-1',
          },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      const client = createBedrockClient(auth);
      await client.send(new ListFoundationModelsCommand({}));
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: (e as Error)?.message,
      };
    }
  },
  required: true,
});

export const awsBedrock = createPiece({
  displayName: 'AWS Bedrock',
  description: 'Build generative AI applications with foundation models',
  auth: awsBedrockAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/aws-bedrock.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["onyedikachi-david"],
  actions: [sendPrompt, generateContentFromImage, generateContentFromFile, generateImage, generateEmbeddings, invokeModel],
  triggers: [],
});