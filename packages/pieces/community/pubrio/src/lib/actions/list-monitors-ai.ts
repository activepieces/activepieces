import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const listMonitorsAi = createAction({
  auth: pubrioAuth,
  name: 'list_monitors_ai',
  displayName: 'List Monitors',
  description: 'List the account signal monitors',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the account\'s signal monitors (paged, orderable by created/updated/name). Read-only and repeatable. Use to enumerate monitors and obtain the `monitor_id` you pass to Get/Update/Delete/Duplicate/Test-Run Monitor.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      required: false,
      defaultValue: 1,
    }),
    per_page: Property.Number({
      displayName: 'Per Page',
      required: false,
      defaultValue: 25,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
          { label: 'Name', value: 'name' },
        ],
      },
    }),
    is_ascending_order: Property.Checkbox({
      displayName: 'Ascending Order',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      page: context.propsValue.page ?? 1,
      per_page: context.propsValue.per_page ?? 25,
    };
    if (context.propsValue.order_by)
      body['order_by'] = context.propsValue.order_by;
    if (context.propsValue.is_ascending_order)
      body['is_ascending_order'] = context.propsValue.is_ascending_order;
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/monitors',
      body
    );
  },
});
