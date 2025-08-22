import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { z } from 'zod';

export interface PineconeConfig {
  apiKey: string;
}

export interface PineconeIndex {
  name: string;
  dimension: number;
  metric: 'euclidean' | 'cosine' | 'dotproduct';
  pods: number;
  replicas: number;
  podType: string;
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface PineconeQueryResponse {
  matches: {
    id: string;
    score: number;
    values?: number[];
    metadata?: Record<string, any>;
  }[];
}

export const vectorSchema = z.object({
  id: z.string().min(1, 'Vector ID cannot be empty'),
  values: z.array(z.number()).min(1, 'Vector must have at least one value'),
  metadata: z.record(z.any()).optional(),
});

export const indexConfigSchema = z.object({
  name: z.string().min(1, 'Index name cannot be empty').max(45, 'Index name too long'),
  dimension: z.number().int().min(1, 'Dimension must be at least 1').max(40000, 'Dimension too large'),
  metric: z.enum(['euclidean', 'cosine', 'dotproduct']),
  pods: z.number().int().min(1).optional(),
  replicas: z.number().int().min(1).optional(),
  podType: z.string().optional(),
});

export const querySchema = z.object({
  vector: z.array(z.number()).min(1, 'Query vector cannot be empty'),
  topK: z.number().int().min(1).max(10000).optional(),
  includeValues: z.boolean().optional(),
  includeMetadata: z.boolean().optional(),
  filter: z.record(z.any()).optional(),
  namespace: z.string().optional(),
});

export { pineconeAuth } from './auth';

export const pineconeCommon = {
  validateVector(vector: any): { valid: boolean; error?: string; vector?: PineconeVector } {
    try {
      const validated = vectorSchema.parse(vector);
      return { valid: true, vector: validated as PineconeVector };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: error.errors[0].message };
      }
      return { valid: false, error: 'Invalid vector format' };
    }
  },

  validateVectors(vectors: any): { valid: boolean; error?: string; vectors?: PineconeVector[] } {
    if (!Array.isArray(vectors)) {
      return { valid: false, error: 'Vectors must be an array' };
    }

    const validatedVectors: PineconeVector[] = [];
    for (let i = 0; i < vectors.length; i++) {
      const result = this.validateVector(vectors[i]);
      if (!result.valid) {
        return { valid: false, error: `Vector ${i}: ${result.error}` };
      }
      validatedVectors.push(result.vector!);
    }

    return { valid: true, vectors: validatedVectors };
  },

  validateIndexConfig(config: any): { valid: boolean; error?: string; config?: any } {
    try {
      const validated = indexConfigSchema.parse(config);
      return { valid: true, config: validated };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: error.errors[0].message };
      }
      return { valid: false, error: 'Invalid index configuration' };
    }
  },

  async makeApiCall(apiKey: string, method: HttpMethod, url: string, data?: any) {
    const headers: Record<string, string> = {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
      'X-Pinecone-API-Version': '2025-01',
    };
    
    return await httpClient.sendRequest({
      method,
      url,
      headers,
      body: data,
    });
  },

  async listIndexes(apiKey: string) {
    const response = await this.makeApiCall(
      apiKey,
      HttpMethod.GET,
      'https://api.pinecone.io/indexes'
    );
    return response.body;
  },

  async createIndex(apiKey: string, indexData: Partial<PineconeIndex>) {
    const response = await this.makeApiCall(
      apiKey,
      HttpMethod.POST,
      'https://api.pinecone.io/indexes',
      indexData
    );
    return response.body;
  },

  async deleteIndex(apiKey: string, indexName: string) {
    const response = await this.makeApiCall(
      apiKey,
      HttpMethod.DELETE,
      `https://api.pinecone.io/indexes/${indexName}`
    );
    return response.body;
  },

  async describeIndex(apiKey: string, indexName: string) {
    const response = await this.makeApiCall(
      apiKey,
      HttpMethod.GET,
      `https://api.pinecone.io/indexes/${indexName}`
    );
    return response.body;
  },

  async getIndexHost(apiKey: string, indexName: string): Promise<string> {
    const indexInfo = await this.describeIndex(apiKey, indexName);
    return indexInfo.host;
  },

  async upsertVectors(apiKey: string, indexHost: string, vectors: PineconeVector[], namespace?: string) {
    const url = `https://${indexHost}/vectors/upsert`;
    const body: any = { vectors };
    if (namespace) {
      body.namespace = namespace;
    }

    const response = await this.makeApiCall(apiKey, HttpMethod.POST, url, body);
    return response.body;
  },

  async getVector(apiKey: string, indexHost: string, id: string, namespace?: string) {
    const params = new URLSearchParams({ ids: id });
    if (namespace) {
      params.append('namespace', namespace);
    }

    const url = `https://${indexHost}/vectors/fetch?${params}`;
    const response = await this.makeApiCall(apiKey, HttpMethod.GET, url);
    return response.body;
  },

  async deleteVectors(apiKey: string, indexHost: string, ids: string[], namespace?: string) {
    const url = `https://${indexHost}/vectors/delete`;
    const body: any = { ids };
    if (namespace) {
      body.namespace = namespace;
    }

    const response = await this.makeApiCall(apiKey, HttpMethod.POST, url, body);
    return response.body;
  },

  async queryVectors(apiKey: string, indexHost: string, queryVector: number[], topK: number = 10, includeValues: boolean = false, includeMetadata: boolean = true, filter?: Record<string, any>, namespace?: string): Promise<PineconeQueryResponse> {
    const url = `https://${indexHost}/query`;
    const body: any = {
      vector: queryVector,
      topK,
      includeValues,
      includeMetadata,
    };
    
    if (filter) {
      body.filter = filter;
    }
    if (namespace) {
      body.namespace = namespace;
    }

    const response = await this.makeApiCall(apiKey, HttpMethod.POST, url, body);
    return response.body;
  },

  async updateVector(apiKey: string, indexHost: string, id: string, values?: number[], metadata?: Record<string, any>, namespace?: string) {
    const url = `https://${indexHost}/vectors/update`;
    const body: any = { id };
    
    if (values) {
      body.values = values;
    }
    if (metadata) {
      body.setMetadata = metadata;
    }
    if (namespace) {
      body.namespace = namespace;
    }

    const response = await this.makeApiCall(apiKey, HttpMethod.POST, url, body);
    return response.body;
  },

  async getIndexStats(apiKey: string, indexHost: string, filter?: Record<string, any>) {
    const url = `https://${indexHost}/describe_index_stats`;
    const body: any = {};
    
    if (filter) {
      body.filter = filter;
    }

    const response = await this.makeApiCall(apiKey, HttpMethod.POST, url, body);
    return response.body;
  }
};