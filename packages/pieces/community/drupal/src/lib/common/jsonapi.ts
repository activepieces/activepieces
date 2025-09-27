/**
 * JSON:API Client - Two-Layer Architecture
 *
 * This module implements a two-layer approach for JSON:API operations:
 *
 * Layer 1 (Generic): Pure JSON:API operations that work with any JSON:API server
 * - jsonApi.get(), jsonApi.list(), jsonApi.create(), etc.
 * - Could be extracted to @activepieces/pieces-common for reuse across pieces
 * - Handles raw JSON:API requests, URLs, and response formats
 *
 * Layer 2 (Drupal-specific): Convenience functions for Drupal entity operations
 * - drupal.getEntity(), drupal.listEntities(), drupal.createEntity(), etc.
 * - Abstracts away entity types, bundles, and URL construction
 * - Provides clean developer experience with simple objects instead of JSON:API format
 */

import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { drupalAuth } from '../../';

type DrupalAuthType = PiecePropValueSchema<typeof drupalAuth>;

export interface JsonApiResource {
  type: string;
  id?: string;
  attributes: Record<string, any>;
  relationships?: Record<string, any>;
}

export interface JsonApiResponse {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  links?: Record<string, string | { href: string }>;
  meta?: Record<string, any>;
}

/**
 * Makes a JSON:API request with proper authentication
 */
export async function makeJsonApiRequest<T = JsonApiResponse>(
  auth: DrupalAuthType,
  endpoint: string,
  method: HttpMethod = HttpMethod.GET,
  body?: any
) {
  const { website_url, username, password } = auth;

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.api+json',
  };

  if (username && password) {
    const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${basicAuth}`;
  }

  if (body) {
    headers['Content-Type'] = 'application/vnd.api+json';
  }

  try {
    return await httpClient.sendRequest({
      method,
      url: endpoint,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    console.error('JSON:API request failed:', { endpoint, method, error });
    throw error;
  }
}

/**
 * Builds JSON:API URL for entity operations
 */
export function getJsonApiUrl(
  baseUrl: string,
  entityType: string,
  bundle: string,
  uuid?: string
): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const resourceType = `${entityType}--${bundle}`;

  let url = `${cleanBaseUrl}/jsonapi/${entityType}/${resourceType}`;

  if (uuid) {
    url += `/${uuid}`;
  }

  return url;
}

/**
 * Converts simple object to JSON:API format
 */
export function toJsonApiFormat(
  entityType: string,
  bundle: string,
  data: Record<string, any>,
  id?: string
): JsonApiResponse {
  const resourceType = `${entityType}--${bundle}`;

  const attributes: Record<string, any> = {};
  const relationships: Record<string, any> = {};

  const isRelationship = (value: any) => value && typeof value === 'object' && 'data' in value;

  for (const [key, value] of Object.entries(data)) {
    if (isRelationship(value)) {
      relationships[key] = value;
    } else {
      attributes[key] = value;
    }
  }

  const resource: JsonApiResource = {
    type: resourceType,
    attributes,
  };

  if (id) {
    resource.id = id;
  }

  if (Object.keys(relationships).length > 0) {
    resource.relationships = relationships;
  }

  return { data: resource };
}

/**
 * Converts JSON:API response to simple object format
 */
export function fromJsonApiFormat(response: JsonApiResponse): any | any[] {
  if (!response.data) return null;

  try {
    if (Array.isArray(response.data)) {
      return response.data
        .filter(resource => resource != null)
        .map(convertJsonApiResource);
    } else {
      return convertJsonApiResource(response.data);
    }
  } catch (error) {
    // Return empty array instead of throwing, so pagination can continue
    return [];
  }
}

function convertJsonApiResource(resource: JsonApiResource) {
  if (!resource || typeof resource !== 'object') {
    throw new Error('Invalid resource: resource is not an object');
  }

  if (!resource.type) {
    throw new Error('Invalid resource: missing required "type" field');
  }

  const result: any = {
    id: resource.id,
    type: resource.type,
  };

  // Safely copy attributes
  if (resource.attributes && typeof resource.attributes === 'object') {
    try {
      Object.assign(result, resource.attributes);
    } catch (error) {
      throw new Error(`Failed to copy attributes: ${error}`);
    }
  }

  // Safely copy relationships
  if (resource.relationships && typeof resource.relationships === 'object') {
    try {
      for (const [key, value] of Object.entries(resource.relationships)) {
        result[key] = value;
      }
    } catch (error) {
      throw new Error(`Failed to copy relationships: ${error}`);
    }
  }

  return result;
}

/**
 * Builds query parameters for JSON:API requests
 */
function buildQueryParams(options: {
  filters?: Record<string, any>;
  sort?: string;
  sortDirection?: string;
  fields?: string[];
  resourceType?: string;
  limit?: number;
}): string {
  const params = new URLSearchParams();

  if (options.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      params.append(`filter[${key}]`, String(value));
    }
  }

  if (options.sort) {
    const sortParam = options.sortDirection === 'ASC'
      ? options.sort
      : `-${options.sort}`;
    params.append('sort', sortParam);
  }

  if (options.fields && options.resourceType) {
    const fieldsParam = options.fields.join(',');
    params.append(`fields[${options.resourceType}]`, fieldsParam);
  }

  if (options.limit && options.limit > 0) {
    params.append('page[limit]', String(options.limit));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// =============================================================================
// LAYER 1: Generic JSON:API Operations
//
// These functions work with any JSON:API server and handle the raw JSON:API
// specification. They could be extracted to @activepieces/pieces-common for
// reuse across different pieces (Rails API, Laravel API, etc.)
// =============================================================================

/**
 * Generic JSON:API client for any JSON:API compliant server
 */
export const jsonApi = {
  /**
   * Fetch a single resource by full JSON:API path
   * @example jsonApi.get(auth, '/jsonapi/node/node--article/12345')
   */
  async get(auth: DrupalAuthType, resourcePath: string) {
    const url = `${auth.website_url.replace(/\/+$/, '')}${resourcePath}`;
    const result = await makeJsonApiRequest(auth, url, HttpMethod.GET);

    if (result.status === 200) {
      return fromJsonApiFormat(result.body as JsonApiResponse);
    } else if (result.status === 404) {
      throw new Error(`Resource not found: ${resourcePath}`);
    } else if (result.status === 403) {
      throw new Error(`Access denied: ${resourcePath}`);
    }

    throw new Error(`Failed to get resource: ${result.status}`);
  },

  /**
   * Fetch a collection of resources with optional query parameters
   * Follows pagination links if present to retrieve all requested data
   * @example jsonApi.list(auth, '/jsonapi/node/node--article', { sort: 'created', filters: { status: '1' } })
   */
  async list(auth: DrupalAuthType, collectionPath: string, options?: {
    filters?: Record<string, any>;
    sort?: string;
    sortDirection?: string;
    fields?: string[];
    resourceType?: string;
    limit?: number;
  }) {
    let allEntities: any[] = [];
    const query = options ? buildQueryParams(options) : '';
    let url: string | null = `${auth.website_url.replace(/\/+$/, '')}${collectionPath}${query}`;

    do {
      const result = await makeJsonApiRequest(auth, url, HttpMethod.GET);

      if (result.status !== 200) {
        throw new Error(`Failed to list resources: ${result.status}`);
      }

      if (!result.body) {
        break;
      }

      // Parse JSON if response body is a string
      let parsedBody: JsonApiResponse;
      if (typeof result.body === 'string') {
        try {
          parsedBody = JSON.parse(result.body);
        } catch (parseError) {
          console.warn('Skipping page due to corrupted data in Drupal database:', parseError);
          url = null; // Stop pagination
          break;
        }
      } else {
        parsedBody = result.body as JsonApiResponse;
      }

      const response = parsedBody;
      const entities = fromJsonApiFormat(response);

      // Add entities from this page
      if (Array.isArray(entities)) {
        allEntities.push(...entities);
      } else if (entities) {
        allEntities.push(entities);
      }

      // Continue to next page if it exists
      const nextLink = response.links?.['next'];
      url = typeof nextLink === 'string' ? nextLink : nextLink?.href || null;

    } while (url);

    return allEntities;
  },

  /**
   * Create a new resource with JSON:API formatted data
   * @example jsonApi.create(auth, '/jsonapi/node/node--article', jsonApiFormattedData)
   */
  async create(auth: DrupalAuthType, collectionPath: string, jsonApiData: JsonApiResponse) {
    const url = `${auth.website_url.replace(/\/+$/, '')}${collectionPath}`;
    const result = await makeJsonApiRequest(auth, url, HttpMethod.POST, jsonApiData);

    if (result.status === 201 || result.status === 200) {
      return fromJsonApiFormat(result.body as JsonApiResponse);
    } else if (result.status === 422) {
      const errors = (result.body as any).errors || [];
      const errorMsg = errors.map((e: any) => e.detail || e.title).join(', ');
      throw new Error(`Validation failed: ${errorMsg}`);
    } else if (result.status === 403) {
      throw new Error('Permission denied to create resource');
    }

    throw new Error(`Failed to create resource: ${result.status}`);
  },

  /**
   * Update a resource with JSON:API formatted data
   * @example jsonApi.update(auth, '/jsonapi/node/node--article/12345', jsonApiFormattedData)
   */
  async update(auth: DrupalAuthType, resourcePath: string, jsonApiData: JsonApiResponse) {
    const url = `${auth.website_url.replace(/\/+$/, '')}${resourcePath}`;
    const result = await makeJsonApiRequest(auth, url, HttpMethod.PATCH, jsonApiData);

    if (result.status === 200) {
      return fromJsonApiFormat(result.body as JsonApiResponse);
    } else if (result.status === 422) {
      const errors = (result.body as any).errors || [];
      const errorMsg = errors.map((e: any) => e.detail || e.title).join(', ');
      throw new Error(`Validation failed: ${errorMsg}`);
    } else if (result.status === 404) {
      throw new Error(`Resource not found: ${resourcePath}`);
    } else if (result.status === 403) {
      throw new Error('Permission denied to update resource');
    }

    throw new Error(`Failed to update resource: ${result.status}`);
  },

  /**
   * Delete a resource
   * @example jsonApi.delete(auth, '/jsonapi/node/node--article/12345')
   */
  async delete(auth: DrupalAuthType, resourcePath: string) {
    const url = `${auth.website_url.replace(/\/+$/, '')}${resourcePath}`;
    const result = await makeJsonApiRequest(auth, url, HttpMethod.DELETE);

    if (result.status === 204 || result.status === 200) {
      return { success: true, message: `Deleted resource: ${resourcePath}` };
    } else if (result.status === 404) {
      throw new Error(`Resource not found: ${resourcePath}`);
    } else if (result.status === 403) {
      throw new Error('Permission denied to delete resource');
    }

    throw new Error(`Failed to delete resource: ${result.status}`);
  }
};

// =============================================================================
// LAYER 2: Drupal-Specific Operations
//
// These functions provide a clean developer experience by abstracting away
// Drupal-specific concepts like entity types, bundles, and JSON:API formatting.
// They use the generic JSON:API layer internally.
// =============================================================================

/**
 * Drupal-specific entity operations with simplified API
 * Handles entity types, bundles, URL construction, and data format conversion
 */
export const drupal = {
  /**
   * Get a single Drupal entity by entity type, bundle, and UUID
   * @example drupal.getEntity(auth, 'node', 'article', '12345-uuid')
   */
  async getEntity(auth: DrupalAuthType, entityType: string, bundle: string, uuid: string) {
    const resourcePath = `/jsonapi/${entityType}/${bundle}/${uuid}`;
    return await jsonApi.get(auth, resourcePath);
  },

  /**
   * List Drupal entities with optional filtering, sorting, and field selection
   * @example drupal.listEntities(auth, 'node', 'article', { filters: { status: '1' }, sort: 'created' })
   */
  async listEntities(auth: DrupalAuthType, entityType: string, bundle: string, options?: {
    filters?: Record<string, any>;
    sort?: string;
    sortDirection?: string;
    fields?: string[];
    limit?: number;
  }) {
    const collectionPath = `/jsonapi/${entityType}/${bundle}`;
    const queryOptions = options ? {
      ...options,
      resourceType: `${entityType}--${bundle}`
    } : undefined;

    return await jsonApi.list(auth, collectionPath, queryOptions);
  },

  /**
   * Create a new Drupal entity with simple object data (automatically converts to JSON:API format)
   * @example drupal.createEntity(auth, 'node', 'article', { title: 'My Article', body: 'Content...' })
   */
  async createEntity(auth: DrupalAuthType, entityType: string, bundle: string, entityData: Record<string, any>) {
    const collectionPath = `/jsonapi/${entityType}/${bundle}`;
    const jsonApiData = toJsonApiFormat(entityType, bundle, entityData);

    return await jsonApi.create(auth, collectionPath, jsonApiData);
  },

  /**
   * Update a Drupal entity with simple object data (automatically converts to JSON:API format)
   * @example drupal.updateEntity(auth, 'node', 'article', '12345-uuid', { title: 'Updated Title' })
   */
  async updateEntity(auth: DrupalAuthType, entityType: string, bundle: string, uuid: string, entityData: Record<string, any>) {
    const resourcePath = `/jsonapi/${entityType}/${bundle}/${uuid}`;
    const jsonApiData = toJsonApiFormat(entityType, bundle, entityData, uuid);

    return await jsonApi.update(auth, resourcePath, jsonApiData);
  },

  /**
   * Delete a Drupal entity
   * @example drupal.deleteEntity(auth, 'node', 'article', '12345-uuid')
   */
  async deleteEntity(auth: DrupalAuthType, entityType: string, bundle: string, uuid: string) {
    const resourcePath = `/jsonapi/${entityType}/${bundle}/${uuid}`;
    return await jsonApi.delete(auth, resourcePath);
  }
};
