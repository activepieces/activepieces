import { createAction, Property, DynamicPropsValue, InputPropertyMap, PieceAuth } from '@activepieces/pieces-framework';
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
    embedderId: Property.Dropdown<string, true, typeof goodmemAuth>({
      displayName: 'Embedder',
      description: 'The embedder model that converts text into vector representations for similarity search',
      required: true,
      refreshers: [],
      auth: goodmemAuth,
      async options({ auth }) {
        if (!auth) {
          return { disabled: true, placeholder: 'Connect your GoodMem account first', options: [] };
        }
        try {
          const authProps = (auth as any).props || auth;
          const baseUrl = (authProps.baseUrl || '').replace(/\/$/, '');
          const apiKey = authProps.apiKey || '';
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/v1/embedders`,
            headers: {
              'X-API-Key': apiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });
          const body = response.body;
          const embedders = Array.isArray(body) ? body : (body?.embedders || []);
          return {
            disabled: false,
            options: embedders.map((e: any) => ({
              label: `${e.displayName || e.name || e.modelIdentifier || 'Unnamed'} (${e.modelIdentifier || e.model || 'unknown'})`,
              value: e.embedderId || e.id,
            })),
          };
        } catch (error) {
          return { disabled: true, placeholder: 'Failed to load embedders. Check your connection.', options: [] };
        }
      },
    }),
    advancedChunking: Property.DynamicProperties({
      displayName: 'Advanced Chunking Options',
      required: false,
      refreshers: [],
      auth: PieceAuth.None(),
      props: async (): Promise<InputPropertyMap> => {
        return {
          chunkSize: Property.Number({
            displayName: 'Chunk Size',
            description: 'Number of characters per chunk when splitting documents',
            required: false,
            defaultValue: 256,
          }),
          chunkOverlap: Property.Number({
            displayName: 'Chunk Overlap',
            description: 'Number of overlapping characters between consecutive chunks',
            required: false,
            defaultValue: 25,
          }),
          keepStrategy: Property.StaticDropdown({
            displayName: 'Keep Separator Strategy',
            description: 'Where to attach the separator when splitting',
            required: false,
            defaultValue: 'KEEP_END',
            options: {
              disabled: false,
              options: [
                { label: 'Keep at End (default)', value: 'KEEP_END' },
                { label: 'Keep at Start', value: 'KEEP_START' },
                { label: 'Discard', value: 'DISCARD' },
              ],
            },
          }),
          lengthMeasurement: Property.StaticDropdown({
            displayName: 'Length Measurement',
            description: 'How chunk size is measured',
            required: false,
            defaultValue: 'CHARACTER_COUNT',
            options: {
              disabled: false,
              options: [
                { label: 'Character Count (default)', value: 'CHARACTER_COUNT' },
                { label: 'Token Count', value: 'TOKEN_COUNT' },
              ],
            },
          }),
        };
      },
    }),
  },
  async run(context) {
    const { name, embedderId, advancedChunking } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    const chunkSize = (advancedChunking as any)?.chunkSize || 256;
    const chunkOverlap = (advancedChunking as any)?.chunkOverlap || 25;
    const keepStrategy = (advancedChunking as any)?.keepStrategy || 'KEEP_END';
    const lengthMeasurement = (advancedChunking as any)?.lengthMeasurement || 'CHARACTER_COUNT';

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
      spaceEmbedders: [{ embedderId, defaultRetrievalWeight: 1.0 }],
      defaultChunkingConfig: {
        recursive: {
          chunkSize,
          chunkOverlap,
          separators: ['\n\n', '\n', '. ', ' ', ''],
          keepStrategy,
          separatorIsRegex: false,
          lengthMeasurement,
        },
      },
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
        chunkingConfig: requestBody.defaultChunkingConfig,
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
