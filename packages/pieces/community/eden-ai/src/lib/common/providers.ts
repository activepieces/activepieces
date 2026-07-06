import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall, EDENAI_V3_BASE_URL } from './client';

type Option = { label: string; value: string };

export function createStaticDropdown(options: Option[]) {
  return async () => ({ options });
}

type EdenModel = { id: string; regions?: { code: string }[] };

function isEuModel(model: EdenModel): boolean {
  return (model.regions ?? []).some((r) => r.code === 'eu');
}

async function fetchEdenModels(auth: unknown): Promise<EdenModel[]> {
  const apiKey = (auth as { secret_text?: string })?.secret_text ?? (auth as string);
  const res = await edenAiApiCall<{ data?: EdenModel[] } | EdenModel[]>({
    apiKey,
    method: HttpMethod.GET,
    baseUrl: EDENAI_V3_BASE_URL,
    resourceUri: '/models',
  });
  return Array.isArray(res) ? res : res?.data ?? [];
}

/** Dropdown of the distinct provider prefixes available on the account (openai, anthropic, mistral, …). */
export async function providerDropdownOptions(auth: unknown) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your Eden AI account first', options: [] as Option[] };
  }
  try {
    const models = await fetchEdenModels(auth);
    const providers = Array.from(new Set(models.map((m) => m.id.split('/')[0]))).sort();
    return { disabled: false, options: providers.map((p) => ({ label: p, value: p })) };
  } catch {
    return { disabled: true, placeholder: 'Failed to load providers — check your API key', options: [] as Option[] };
  }
}

/**
 * Dropdown of chat models from GET /v3/models. Optionally filter by provider and/or to
 * EU-hosted models only. EU-hosted models are flagged with 🇪🇺 so residency is visible at a glance.
 * The value is the exact Eden AI model id (e.g. "openai/gpt-4o", "amazon/amazon.nova-2-lite-v1:0@eu").
 */
export async function modelDropdownOptions(auth: unknown, provider?: string, euOnly?: boolean) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your Eden AI account first', options: [] as Option[] };
  }
  try {
    let models = await fetchEdenModels(auth);
    if (provider) {
      models = models.filter((m) => m.id.startsWith(`${provider}/`));
    }
    if (euOnly) {
      models = models.filter(isEuModel);
    }
    const options = models
      .map((m) => ({ label: isEuModel(m) ? `🇪🇺 ${m.id}` : m.id, value: m.id }))
      .sort((a, b) => a.value.localeCompare(b.value));
    if (options.length === 0) {
      return {
        disabled: true,
        placeholder: euOnly ? 'No EU-hosted models match this provider' : 'No models found',
        options: [] as Option[],
      };
    }
    return { disabled: false, options };
  } catch {
    return { disabled: true, placeholder: 'Failed to load models — check your API key', options: [] as Option[] };
  }
}
