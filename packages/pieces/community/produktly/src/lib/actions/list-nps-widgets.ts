import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';

export const listNpsWidgets = createAction({
  auth: produktlyAuth,
  name: 'list_nps_widgets',
  displayName: 'List NPS Widgets',
  description: 'List all NPS widgets configured in your Produktly account.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of widgets to return (1-100, default 50).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of widgets to skip for pagination (default 0).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        name: string;
        active: boolean;
        createdAt: string;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/nps-widgets',
      queryParams: {
        limit: String(propsValue.limit ?? 50),
        offset: String(propsValue.offset ?? 0),
      },
    });
    return response.body.data.map((widget) => ({
      widget_id: widget.id,
      widget_name: widget.name,
      widget_active: widget.active,
      widget_created_at: widget.createdAt,
    }));
  },
});
