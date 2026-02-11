import {
  BedrockClient,
  ListFoundationModelsCommand,
} from '@aws-sdk/client-bedrock';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

export interface BedrockAuth {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export function createBedrockClient(auth: BedrockAuth): BedrockClient {
  return new BedrockClient({
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
    },
    region: auth.region,
  });
}

export function createBedrockRuntimeClient(
  auth: BedrockAuth
): BedrockRuntimeClient {
  return new BedrockRuntimeClient({
    credentials: {
      accessKeyId: auth.accessKeyId,
      secretAccessKey: auth.secretAccessKey,
    },
    region: auth.region,
  });
}

export async function getBedrockModelOptions(auth: BedrockAuth | undefined) {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'Connect your AWS account first',
      options: [],
    };
  }

  try {
    const client = createBedrockClient(auth);
    const response = await client.send(new ListFoundationModelsCommand({}));
    const models = response.modelSummaries ?? [];

    const textModels = models.filter(
      (m) =>
        m.inputModalities?.includes('TEXT') &&
        m.outputModalities?.includes('TEXT')
    );

    return {
      disabled: false,
      options: textModels.map((m) => ({
        label: `${m.providerName} - ${m.modelName}`,
        value: m.modelId!,
      })),
    };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Failed to load models. Check your credentials.',
    };
  }
}
