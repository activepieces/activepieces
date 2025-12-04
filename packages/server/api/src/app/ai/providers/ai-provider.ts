import { AIProviderConfig } from '@activepieces/common-ai'

export type AIProviderStrategy<T extends AIProviderConfig> = {
    name(): string;
    listModels(config: T): Promise<ProviderModel[]>;
}

export type ProviderModel = {
    id: string;
    name: string;
    type: 'image' | 'text';
}
