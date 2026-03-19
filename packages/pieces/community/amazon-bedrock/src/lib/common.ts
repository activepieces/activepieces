import {
  BedrockClient,
  ListFoundationModelsCommand,
  ListInferenceProfilesCommand,
  ModelModality,
} from '@aws-sdk/client-bedrock';
import {
  BedrockRuntimeClient,
  ConverseResponse,
} from '@aws-sdk/client-bedrock-runtime';

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

export async function getBedrockModelOptions(
  auth: BedrockAuth | undefined,
  filters?: {
    inputModality?: ModelModality;
    outputModality?: ModelModality;
    showAll?: boolean;
    useInferenceProfiles?: boolean;
  }
) {
  if (!auth) {
    return {
      disabled: true,
      placeholder: 'Connect your AWS account first',
      options: [],
    };
  }

  try {
    const client = createBedrockClient(auth);

    if (filters?.useInferenceProfiles) {
      const [profileResponse, modelsResponse] = await Promise.all([
        client.send(
          new ListInferenceProfilesCommand({
            typeEquals: 'SYSTEM_DEFINED',
          })
        ),
        filters?.inputModality
          ? client.send(new ListFoundationModelsCommand({}))
          : Promise.resolve(undefined),
      ]);

      const profiles = profileResponse.inferenceProfileSummaries ?? [];

      let allowedModelIds: Set<string> | undefined;
      if (filters?.inputModality && modelsResponse) {
        const allModels = modelsResponse.modelSummaries ?? [];
        allowedModelIds = new Set(
          allModels
            .filter((m) =>
              m.inputModalities?.includes(filters.inputModality!)
            )
            .map((m) => m.modelId!)
            .filter(Boolean)
        );
      }

      const seen = new Set<string>();
      const deduped = profiles.filter((p) => {
        if (!p.inferenceProfileId || p.status !== 'ACTIVE') return false;
        if (seen.has(p.inferenceProfileId)) return false;
        if (allowedModelIds) {
          const profileModelId = p.models?.[0]?.modelArn?.split('/').pop();
          if (!profileModelId || !allowedModelIds.has(profileModelId)) {
            return false;
          }
        }
        seen.add(p.inferenceProfileId);
        return true;
      });

      return {
        disabled: false,
        options: deduped.map((p) => ({
          label: p.inferenceProfileName ?? p.inferenceProfileId!,
          value: p.inferenceProfileId!,
        })),
      };
    }

    const response = await client.send(
      new ListFoundationModelsCommand({
        byOutputModality: filters?.showAll
          ? undefined
          : (filters?.outputModality ?? ModelModality.TEXT),
      })
    );
    const models = response.modelSummaries ?? [];

    const filtered = filters?.inputModality
      ? models.filter((m) =>
          m.inputModalities?.includes(filters.inputModality!)
        )
      : models;

    const seen = new Set<string>();
    const deduped = filtered.filter((m) => {
      if (!m.modelId) return false;
      const baseId = m.modelId.replace(/:\d+:.*$/, '');
      if (seen.has(baseId)) return false;
      seen.add(baseId);
      return true;
    });

    return {
      disabled: false,
      options: deduped.map((m) => ({
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

export function extractConverseTextResponse(response: ConverseResponse) {
  const outputMessage = response.output?.message;
  const textContent = outputMessage?.content
    ?.filter((block) => 'text' in block)
    .map((block) => block.text)
    .join('');

  return {
    text: textContent ?? '',
    stopReason: response.stopReason,
    usage: response.usage,
    latencyMs: response.metrics?.latencyMs,
  };
}

export function formatBedrockError(error: unknown): string {
  const err = error as { name?: string; message?: string };
  const name = err.name ?? 'UnknownError';

  switch (name) {
    case 'ThrottlingException':
      return 'Request was throttled by AWS Bedrock. Please try again in a moment.';
    case 'ModelNotReadyException':
      return 'The model is not ready. It may still be loading — please try again shortly.';
    case 'ModelTimeoutException':
      return 'The model timed out while processing your request. Try a shorter prompt or a different model.';
    case 'ModelErrorException':
      return 'The model encountered an internal error. Try again or use a different model.';
    case 'AccessDeniedException':
      return 'Access denied. Ensure your AWS credentials have permission to invoke this model and that the model is enabled in your region.';
    case 'ValidationException':
      return `Validation error: ${err.message ?? 'Check your input parameters.'}`;
    case 'ServiceUnavailableException':
      return 'AWS Bedrock is temporarily unavailable. Please try again later.';
    case 'ServiceQuotaExceededException':
      return 'You have exceeded your AWS Bedrock service quota.';
    default:
      return err.message ?? 'An unexpected error occurred.';
  }
}
