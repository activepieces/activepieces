import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PineconeAuth } from './auth';

export class PineconeClient {
  private auth: PineconeAuth;

  constructor(auth: PineconeAuth) {
    this.auth = auth;
  }

  /**
   * Headers for Pinecone Management API (indexes)
   * Used for: creating, listing, and managing indexes
   * Requires: Api-Key + x-project-id
   */
  private getManagementHeaders() {
    return {
      'Api-Key': this.auth.apiKey,
      'x-project-id': this.auth.projectId,
    };
  }

  /**
   * Headers for Pinecone Vector Operations API (vectors)
   * Used for: upserting, querying, deleting, and updating vectors
   * Requires: Api-Key only
   */
  private getVectorHeaders() {
    return {
      'Api-Key': this.auth.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get index information including host
   */
  async getIndex(indexName: string) {
    const response = await httpClient.sendRequest({
      url: `https://api.pinecone.io/indexes/${indexName}`,
      method: HttpMethod.GET,
      headers: this.getManagementHeaders(),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get index information: ${response.status}`);
    }

    return response.body as any;
  }

  /**
   * Get all indexes
   */
  async getAllIndexes() {
    const response = await httpClient.sendRequest({
      url: 'https://api.pinecone.io/indexes',
      method: HttpMethod.GET,
      headers: this.getManagementHeaders(),
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get all indexes: ${response.status}`);
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
      headers: this.getManagementHeaders(),
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
    try {
      const response = await httpClient.sendRequest({
        url: `https://${host}/vectors/delete`,
        method: HttpMethod.POST,
        headers: this.getVectorHeaders(),
        body: requestBody,
      });

      if (response.status !== 200) {
        throw new Error(`Failed to delete vectors: ${response.status} - ${JSON.stringify(response.body)}`);
      }

      return response.body as any;
    } catch (error: any) {
      // Enhanced error handling for delete operations
      if (error.response) {
        const { status, body } = error.response;
        console.error('Delete vectors API error:', {
          status,
          body,
          requestBody,
          host
        });
        
        // Provide more specific error messages for common issues
        if (status === 400) {
          throw new Error(`Invalid delete request: ${body?.message || body?.error || JSON.stringify(body)}`);
        } else if (status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        } else if (status === 404) {
          throw new Error('Index not found or vectors not found.');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`Delete operation failed with status ${status}: ${JSON.stringify(body)}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * Upsert vectors to an index
   */
  async upsertVectors(host: string, requestBody: any) {
    const response = await httpClient.sendRequest({
      url: `https://${host}/vectors/upsert`,
      method: HttpMethod.POST,
      headers: this.getVectorHeaders(),
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
      headers: this.getVectorHeaders(),
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
      headers: this.getVectorHeaders(),
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
      headers: this.getVectorHeaders(),
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
      headers: this.getVectorHeaders(),
      body: requestBody || {},
    });

    if (response.status !== 200) {
      throw new Error(`Failed to describe index stats: ${response.status} - ${JSON.stringify(response.body)}`);
    }

    return response.body as any;
  }
} 