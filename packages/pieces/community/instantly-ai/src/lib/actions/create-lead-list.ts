import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../auth';

export const createLeadListAction = createAction({
  auth: instantlyAiAuth,
  name: 'create_lead_list',
  displayName: 'Create Lead List',
  description: 'Creates a new lead list.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new lead list in Instantly, optionally enabling an enrichment task that runs on every lead added to the list. Use this to set up a container for organizing leads before importing or adding them. Not idempotent — each call creates a new list even with the same name.', idempotent: false },
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
    has_enrichment_task: Property.Checkbox({
      displayName: 'Enable Enrichment',
      description: 'Whether this list runs the enrichment process on every added lead or not.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      name,
      has_enrichment_task,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const payload: Record<string, unknown> = {
      name,
    };

    if (has_enrichment_task !== undefined) {
      payload['has_enrichment_task'] = has_enrichment_task;
    }

    return await makeRequest({
      endpoint: 'lead-lists',
      method: HttpMethod.POST,
      apiKey: apiKey,
      body: payload,
    });
  },
});
