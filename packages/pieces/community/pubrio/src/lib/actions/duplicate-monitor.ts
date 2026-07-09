import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const duplicateMonitor = createAction({
  auth: pubrioAuth,
  name: 'duplicate_monitor',
  displayName: 'Duplicate Monitor',
  description: 'Duplicate an existing monitor',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a copy of an existing monitor (referenced by ID), optionally with a new name. Not idempotent: each call creates a separate new monitor, so repeated calls produce duplicates.',
    idempotent: false,
  },
  props: {
    monitor_id: Property.ShortText({
      displayName: 'Monitor ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      required: false,
      description: 'Name for the duplicated monitor',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      monitor_id: context.propsValue.monitor_id,
    };
    if (context.propsValue.name) body['name'] = context.propsValue.name;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/monitors/duplicate',
      body
    );
  },
});
