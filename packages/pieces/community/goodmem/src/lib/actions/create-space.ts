import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const createSpace = createAction({
  auth: goodmemAuth,
  name: 'create_space',
  displayName: 'Create Space',
  description: 'Create a new space or reuse an existing one. A space is a logical container for organizing related memories, configured with embedders that convert text to vector embeddings',
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'A unique name for the space. If a space with this name already exists, its ID will be returned instead of creating a duplicate',
      required: true,
    }),
    embedderId: Property.ShortText({
      displayName: 'Embedder ID',
      description: 'The ID of the embedder model that converts text into vector representations for similarity search',
      required: true,
    }),
  },
  async run(context) {
    const { name, embedderId } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    // Check if a space with the same name already exists
    try {
      const listResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${baseUrl}/v1/spaces`,
        headers: getCommonHeaders(apiKey),
      });

      const body = listResponse.body;
      const spaces = Array.isArray(body) ? body : (body?.spaces || []);
      if (spaces.length > 0) {
        const existing = spaces.find((s: any) => s.name === name);
        if (existing) {
          return {
            success: true,
            spaceId: existing.spaceId,
            name: existing.name,
            embedderId,
            message: 'Space already exists, reusing existing space',
            reused: true,
          };
        }
      }
    } catch (listError: any) {
      // If listing fails, proceed to create
    }

    const requestBody: any = {
      name,
      spaceEmbedders: [{ embedderId }],
    };

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/v1/spaces`,
        headers: getCommonHeaders(apiKey),
        body: requestBody,
      });

      return {
        success: true,
        spaceId: response.body.spaceId,
        name: response.body.name,
        embedderId,
        message: 'Space created successfully',
        reused: false,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create space',
        details: error.response?.body || error,
      };
    }
  },
});
