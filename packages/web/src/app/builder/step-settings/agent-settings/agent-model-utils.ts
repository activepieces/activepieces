import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AgentProviderModel,
  ModelChoice,
  ModelOptions,
} from '@activepieces/shared';
import semver from 'semver';

function choiceOf({ value }: { value: unknown }): ModelChoice | null {
  if (!isRecord(value)) {
    return null;
  }
  const tierId = stringOf(value['modelTierId']);
  if (!isNil(tierId)) {
    return { type: 'tier', tierId };
  }
  const provider = Object.values(AIProviderName).find(
    (name) => name === value['provider'],
  );
  const modelId = stringOf(value['model']);
  if (isNil(provider) || isNil(modelId)) {
    return null;
  }
  return {
    type: 'model',
    provider,
    providerConfigId: stringOf(value['configId']) ?? '',
    modelId,
  };
}

function valueOf({ choice }: { choice: ModelChoice }): AgentProviderModel {
  if (choice.type === 'tier') {
    return { modelTierId: choice.tierId };
  }
  return {
    provider: choice.provider,
    model: choice.modelId,
    ...(choice.providerConfigId === ''
      ? {}
      : { configId: choice.providerConfigId }),
  };
}

function defaultFor({
  options,
  withTiers,
}: {
  options: ModelOptions;
  withTiers: boolean;
}): ModelChoice | null {
  if (withTiers || options.defaultChoice?.type !== 'tier') {
    return options.defaultChoice ?? null;
  }
  if (!isNil(options.credits)) {
    return {
      type: 'model',
      provider: AIProviderName.ACTIVEPIECES,
      providerConfigId: options.credits.providerConfigId,
      modelId: options.credits.defaultTierId,
    };
  }
  const key = options.keys.find((candidate) => candidate.models.length > 0);
  if (isNil(key)) {
    return null;
  }
  return {
    type: 'model',
    provider: key.provider,
    providerConfigId: key.providerConfigId,
    modelId: key.models[0].id,
  };
}

function supportsTiers({ pieceVersion }: { pieceVersion: string }): boolean {
  return (
    !isNil(semver.valid(pieceVersion)) &&
    semver.gte(pieceVersion, FIRST_PIECE_VERSION_WITH_TIERS)
  );
}

function isEmpty({ value }: { value: unknown }): boolean {
  return !isRecord(value) || Object.keys(value).length === 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOf(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

const FIRST_PIECE_VERSION_WITH_TIERS = '0.14.1';

export const agentModelUtils = {
  choiceOf,
  valueOf,
  defaultFor,
  supportsTiers,
  isEmpty,
};
