import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const deleteMonitor = createAction({
  auth: pubrioAuth,
  name: 'delete_monitor',
  displayName: 'Delete Monitor',
  description: 'Delete a monitor by ID',
  props: {
    monitor_id: Property.ShortText({
      displayName: 'Monitor ID',
      required: true,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      monitor_id: context.propsValue.monitor_id,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/monitors/delete',
      body
    );
  },
});
