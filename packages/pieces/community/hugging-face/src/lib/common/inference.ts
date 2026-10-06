import { Property } from '@activepieces/pieces-framework';
import {
  InferenceClientHubApiError,
  InferenceClientInputError,
  InferenceClientProviderApiError,
  InferenceProviderOrPolicy,
  PROVIDERS_OR_POLICIES,
} from '@huggingface/inference';

function findProvider(value: string): InferenceProviderOrPolicy | undefined {
  return PROVIDERS_OR_POLICIES.find((provider) => provider === value);
}

function resolveModelAndProvider({ model, provider, defaultModel }: ResolveModelParams): ResolvedModel {
  const trimmed = (model ?? '').trim() || (defaultModel ?? '');
  if (trimmed.length === 0) {
    throw new Error('Model is required.');
  }
  const selected = provider ? findProvider(provider) : undefined;
  if (provider && !selected) {
    throw new Error(`Unknown inference provider '${provider}'. Use one of: ${PROVIDERS_OR_POLICIES.join(', ')}.`);
  }
  const colon = trimmed.lastIndexOf(':');
  if (colon <= 0) {
    return { model: trimmed, provider: selected };
  }
  const baseModel = trimmed.slice(0, colon);
  const suffix = trimmed.slice(colon + 1).trim();
  if (suffix === 'fastest' || suffix === 'cheapest') {
    throw new Error(
      `The ':${suffix}' routing policy is not supported by this action. Remove the suffix to use your provider preference order, or pick a provider explicitly.`
    );
  }
  const suffixProvider = suffix === 'preferred' ? 'auto' : findProvider(suffix);
  if (!suffixProvider) {
    throw new Error(
      `Unknown provider suffix ':${suffix}' on model '${trimmed}'. Use one of: ${PROVIDERS_OR_POLICIES.join(', ')}, or ':preferred'.`
    );
  }
  if (selected && selected !== suffixProvider) {
    throw new Error(
      `The model suffix ':${suffix}' conflicts with the selected provider '${selected}'. Set only one of them.`
    );
  }
  return { model: baseModel, provider: suffixProvider };
}

function toInferenceError(error: unknown): Error {
  if (error instanceof InferenceClientProviderApiError || error instanceof InferenceClientHubApiError) {
    const status = error.httpResponse.status;
    switch (status) {
      case 401:
        return new Error(
          `Hugging Face rejected the token for inference (401). Use a valid token; fine-grained tokens need the "Make calls to Inference Providers" permission. ${error.message}`
        );
      case 402:
        return new Error(
          `Inference Providers credits are exhausted (402). Add credits or a payment method in your Hugging Face billing settings. ${error.message}`
        );
      case 403:
        return new Error(
          `Access denied for inference (403). The token lacks inference permission, or the model is gated and this account has not been granted access. ${error.message}`
        );
      case 404:
        return new Error(
          `Model not found or not served by the chosen provider (404). Find a served model with Search Models (inference_provider 'all'). ${error.message}`
        );
      case 429:
        return new Error(`Inference rate limit reached (429). Retry in a few minutes. ${error.message}`);
      default:
        return new Error(`Inference request failed (${status}). ${error.message}`);
    }
  }
  if (error instanceof InferenceClientInputError) {
    return new Error(error.message);
  }
  return error instanceof Error ? error : new Error(String(error));
}

function providerProp() {
  return Property.StaticDropdown({
    displayName: 'Provider',
    description:
      "Inference provider to run the model on. Leave empty (or 'auto') to use the first available provider in your Hugging Face provider preference order.",
    required: false,
    options: {
      disabled: false,
      options: PROVIDERS_OR_POLICIES.map((provider) => ({
        label: provider === 'auto' ? 'Auto (your preference order)' : provider,
        value: provider,
      })),
    },
  });
}

function optionalBooleanProp({ displayName, description }: OptionalBooleanParams) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

export const hfInference = {
  resolveModelAndProvider,
  toError: toInferenceError,
  providerProp,
  optionalBooleanProp,
};

type ResolveModelParams = {
  model: string | undefined;
  provider: string | undefined;
  defaultModel?: string;
};

type ResolvedModel = {
  model: string;
  provider: InferenceProviderOrPolicy | undefined;
};

type OptionalBooleanParams = {
  displayName: string;
  description: string;
};
