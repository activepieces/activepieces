import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PineconeAuth } from './auth';

export class PineconeClient {
  private auth: PineconeAuth;

  constructor(auth: PineconeAuth) {
    this.auth = auth;
  }

  private getHeaders() {
    return {
      'Api-Key': this.auth.apiKey,
      'x-project-id': this.auth.projectId,
    };
  }

  /**
   * Get index information including host
   */
  async getIndex(indexName: string) {
    const response = await httpClient.sendRequest({
      url: `https://api.pinecone.io/indexes/${indexName}`,
      method: HttpMethod.GET,
      headers: this.getHeaders(),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get index information: ${response.status}`);
    }

    return response.body as any;
  }

  /**
   * Create a new index
   */
  async createIndex(requestBody: any) {
    const response = await httpClient.sendRequest({
      url: 'https://api.pinecone.io/indexes',
      method: HttpMethod.POST,
      headers: this.getHeaders(),
      body: requestBody,
    });

    if (response.status !== 201) {
      throw new Error(`Failed to create index: ${JSON.stringify(response)}`);
    }

    return response.body as any;
  }

  /**
   * Delete vectors from an index
   */
  async deleteVectors(host: string, requestBody: any) {
    const response = await httpClient.sendRequest({
      url: `https://${host}/vectors/delete`,
      method: HttpMethod.POST,
      headers: this.getHeaders(),
      body: requestBody,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to delete vectors: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body as any;
  }

  /**
   * Upsert vectors to an index
   */
  async upsertVectors(host: string, requestBody: any) {
    const response = await httpClient.sendRequest({
      url: `https://${host}/vectors/upsert`,
      method: HttpMethod.POST,
      headers: this.getHeaders(),
      body: requestBody,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to upsert vectors: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body as any;
  }

  /**
   * Query vectors from an index
   */
  async queryVectors(host: string, requestBody: any) {
    const response = await httpClient.sendRequest({
      url: `https://${host}/query`,
      method: HttpMethod.POST,
      headers: this.getHeaders(),
      body: requestBody,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to query vectors: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body as any;
  }

  /**
   * Fetch a specific vector by ID
   */
  async fetchVector(host: string, requestBody: any) {
    const response = await httpClient.sendRequest({
      url: `https://${host}/vectors/fetch`,
      method: HttpMethod.GET,
      headers: this.getHeaders(),
      queryParams: requestBody,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch vector: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body as any;
  }

  /**
   * Update a vector
   */
  async updateVector(host: string, requestBody: any) {
    const response = await httpClient.sendRequest({
      url: `https://${host}/vectors/update`,
      method: HttpMethod.POST,
      headers: this.getHeaders(),
      body: requestBody,
    });

    if (response.status !== 200) {
      throw new Error(`Failed to update vector: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body as any;
  }

  /**
   * Describe index statistics
   */
  async describeIndexStats(host: string, requestBody?: any) {
    const response = await httpClient.sendRequest({
      url: `https://${host}/describe_index_stats`,
      method: HttpMethod.POST,
      headers: this.getHeaders(),
      body: requestBody || {},
    });

    if (response.status !== 200) {
      throw new Error(`Failed to describe index stats: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body as any;
  }
} 