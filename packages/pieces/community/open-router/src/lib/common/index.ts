export const mapOpenRouterModelSummary = (model: OpenRouterModel) => ({
  id: model.id,
  name: model.name,
  description: model.description ?? null,
  contextLength: model.context_length ?? null,
  promptPrice: model.pricing?.prompt ?? null,
  completionPrice: model.pricing?.completion ?? null,
  supportedParameters: model.supported_parameters?.join(', ') ?? null,
});

export const mapOpenRouterEndpoint = (endpoint: OpenRouterEndpoint) => ({
  name: endpoint.name,
  modelId: endpoint.model_id ?? null,
  modelName: endpoint.model_name ?? null,
  providerName: endpoint.provider_name,
  contextLength: endpoint.context_length,
  promptPrice: endpoint.pricing?.prompt ?? null,
  completionPrice: endpoint.pricing?.completion ?? null,
  quantization: endpoint.quantization,
  maxCompletionTokens: endpoint.max_completion_tokens,
  status: endpoint.status,
  uptimeLast30m: endpoint.uptime_last_30m,
});

export interface promptResponse {
  choices: {
    text: string;
  }[];
  model: string;
  id: string;
}

export interface openRouterModels {
  data: {
    id: string;
    name: string;
  }[];
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  supported_parameters?: string[];
}

export interface OpenRouterProvider {
  name: string;
  slug: string;
  privacy_policy_url: string | null;
  terms_of_service_url: string | null;
  status_page_url: string | null;
  headquarters: string | null;
  datacenters: string[] | null;
}

export interface OpenRouterEndpoint {
  name: string;
  model_id?: string;
  model_name?: string;
  provider_name: string;
  context_length: number | null;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  quantization: string | null;
  max_completion_tokens: number | null;
  status: number;
  uptime_last_30m: number | null;
}
