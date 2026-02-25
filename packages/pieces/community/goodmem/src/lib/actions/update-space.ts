import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { goodmemAuth } from '../../index';
import { getBaseUrl, getCommonHeaders, extractAuthFromContext } from '../common';

export const updateSpace = createAction({
  auth: goodmemAuth,
  name: 'update_space',
  displayName: 'Update Space',
  description: 'Update an existing space. You can change the name, public read access, and labels. Embedders and chunking config are immutable after creation.',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The UUID of the space to update (returned by Create Space)',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'New name for the space. Must be unique per owner. Leave empty to keep current name.',
      required: false,
    }),
    publicRead: Property.Checkbox({
      displayName: 'Public Read',
      description: 'Allow unauthenticated users to read this space and its memories',
      required: false,
      defaultValue: false,
    }),
    replaceLabels: Property.Json({
      displayName: 'Replace Labels',
      description: 'Replace all existing labels with these key-value pairs (e.g., {"project": "legal", "team": "research"}). Cannot be used together with Merge Labels.',
      required: false,
    }),
    mergeLabels: Property.Json({
      displayName: 'Merge Labels',
      description: 'Merge these key-value pairs into existing labels. New keys are added, existing keys are updated. Cannot be used together with Replace Labels.',
      required: false,
    }),
  },
  async run(context) {
    const { spaceId, name, publicRead, replaceLabels, mergeLabels } = context.propsValue;
    const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth);
    const baseUrl = getBaseUrl(rawBaseUrl);

    const hasReplaceLabels = replaceLabels && typeof replaceLabels === 'object' && Object.keys(replaceLabels).length > 0;
    const hasMergeLabels = mergeLabels && typeof mergeLabels === 'object' && Object.keys(mergeLabels).length > 0;

    if (hasReplaceLabels && hasMergeLabels) {
      return {
        success: false,
        error: 'Cannot use both Replace Labels and Merge Labels at the same time. Choose one.',
      };
    }

    const requestBody: any = {};
    if (name) {
      requestBody.name = name;
    }
    if (publicRead !== undefined) {
      requestBody.publicRead = publicRead;
    }
    if (hasReplaceLabels) {
      requestBody.replaceLabels = replaceLabels;
    }
    if (hasMergeLabels) {
      requestBody.mergeLabels = mergeLabels;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: `${baseUrl}/v1/spaces/${spaceId}`,
        headers: getCommonHeaders(apiKey),
        body: requestBody,
      });

      return {
        success: true,
        space: response.body,
        message: 'Space updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update space',
        details: error.response?.body || error,
      };
    }
  },
});
