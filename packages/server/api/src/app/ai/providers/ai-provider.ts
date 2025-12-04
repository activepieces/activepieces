import { AIProvider, AIUsageMetadata } from '@activepieces/common-ai'
import { SeekPage } from '@activepieces/shared'
import { Type } from '@sinclair/typebox';
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'


export type AIProviderStrategy<T extends object> = {
    name(): string;
    listModels(config: T): Promise<ProviderModel[]>;
    authHeaders(config: T): Record<string, string>;
}

export type ConfigSchema<T> = { attribute: keyof T; label: string; type: 'string' | 'number' }[];

export type ProviderModel = {
    id: string;
    name: string;
    type: 'image' | 'text';
}
