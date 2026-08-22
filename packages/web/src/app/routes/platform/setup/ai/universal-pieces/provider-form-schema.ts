import { AIProviderName } from '@activepieces/core-utils';
import {
  AnthropicProviderAuthConfig,
  AnthropicProviderConfig,
  aiProviderUtils,
  AzureProviderAuthConfig,
  AzureProviderConfig,
  BaseAIProviderAuthConfig,
  BedrockProviderAuthConfig,
  BedrockProviderConfig,
  CloudflareGatewayProviderAuthConfig,
  CloudflareGatewayProviderConfig,
  GoogleProviderAuthConfig,
  GoogleProviderConfig,
  OpenAICompatibleProviderAuthConfig,
  OpenAICompatibleProviderConfig,
  OpenAiCompatibleVendorConfig,
  OpenAIProviderAuthConfig,
  OpenAIProviderConfig,
} from '@activepieces/shared';
import { z } from 'zod';

const OptionalAuthSchema = z
  .object({
    apiKey: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
  })
  .optional();

export const createFormSchema = (
  provider: AIProviderName,
  editMode: boolean,
) => {
  if (provider === AIProviderName.AZURE) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.AZURE),
      config: AzureProviderConfig,
      auth: editMode ? OptionalAuthSchema : AzureProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CLOUDFLARE_GATEWAY) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.CLOUDFLARE_GATEWAY),
      config: CloudflareGatewayProviderConfig,
      auth: editMode ? OptionalAuthSchema : CloudflareGatewayProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.CUSTOM) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.CUSTOM),
      config: OpenAICompatibleProviderConfig,
      auth: editMode ? OptionalAuthSchema : OpenAICompatibleProviderAuthConfig,
    });
  }
  if (provider === AIProviderName.BEDROCK) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(AIProviderName.BEDROCK),
      config: BedrockProviderConfig,
      auth: editMode ? OptionalAuthSchema : BedrockProviderAuthConfig,
    });
  }
  if (aiProviderUtils.isOpenAiCompatibleVendor(provider)) {
    return z.object({
      displayName: z.string().min(1),
      provider: z.literal(provider),
      config: OpenAiCompatibleVendorConfig,
      auth: editMode ? OptionalAuthSchema : BaseAIProviderAuthConfig,
    });
  }
  const authSchema = z.union([
    AnthropicProviderAuthConfig,
    GoogleProviderAuthConfig,
    OpenAIProviderAuthConfig,
  ]);
  return z.object({
    displayName: z.string().min(1),
    provider: z.literal(provider),
    auth: editMode ? OptionalAuthSchema : authSchema,
    config: z.union([
      AnthropicProviderConfig,
      GoogleProviderConfig,
      OpenAIProviderConfig,
    ]),
  });
};
