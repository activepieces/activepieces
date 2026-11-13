import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioFilterAppStreamOutputSchema } from '../../../output-schemas';

export const filterAppStreamAction = createAction({
  auth: podioAuth,
  name: 'podio_filter_app_stream',
  outputSchema: podioFilterAppStreamOutputSchema,
  displayName: 'Filter App Stream',
  description: 'Gets the activity stream of an app, limited to the items of a view or filter.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Reads the activity stream of one Podio app, limited to the items that match a view or a set of item filters, newest first, paged with limit and offset. Use Get App Stream for the whole app. The app id comes from List Apps In Space and view ids from List Views.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps In Space.' }),
    viewId: podioAiProps.text({ required: false, displayName: 'View', description: 'The id of a view from List Views, "default" for the default view, or "0" for the last used view.' }),
    filters: podioAiProps.json({ required: false, displayName: 'Filters', description: 'Item filters, keyed by field id or filter key, in the format Filter Items takes, such as {"created_on": {"from": "2024-01-01"}}.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of stream entries to return. Defaults to 10.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.POST,
      path: `/stream/app/${propsValue.appId}/filter`,
      body: podioUtils.body({
        values: {
          view_id: toViewId({ value: propsValue.viewId }),
          filters: propsValue.filters,
          offset: propsValue.offset,
          limit: propsValue.limit ?? 10,
        },
      }),
    });
    return { events: body, count: body.length };
  },
});

function toViewId({ value }: { value: string | undefined }): string | number | undefined {
  return value !== undefined && /^\d+$/.test(value) ? Number(value) : value;
}
