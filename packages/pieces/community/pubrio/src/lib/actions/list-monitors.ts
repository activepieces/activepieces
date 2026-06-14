import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const listMonitors = createAction({
  auth: pubrioAuth,
  name: 'list_monitors',
  displayName: 'List Monitors',
  description: 'List all monitors with pagination',
  audience: 'both',
  aiMetadata: {
    description:
      'List the account\'s signal monitors with paging and ordering (by created_at, updated_at, or name). Read-only and repeatable. Use to enumerate existing monitors or find a monitor_id to pass to Update, Delete, Test Run, or Reveal Monitor Signature.',
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
