import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { InstantlyLeadList } from '../common/types';

export const createLeadListAction = createAction({
  auth: instantlyAuth,
  name: 'create_lead_list',
  classification: 'WRITE',
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
      description:
        'Whether this list runs the enrichment process on every added lead or not.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { name, has_enrichment_task } = context.propsValue;

    return instantlyClient.makeRequest<InstantlyLeadList>({
      auth: context.auth.secret_text,
      method: HttpMethod.POST,
      path: 'lead-lists',
      body: { name, has_enrichment_task },
    });
  },
});
