import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateLastViewAction = createAction({
  auth: podioAuth,
  name: 'podio_update_last_view',
  displayName: 'Update Last View',
  description: 'Sets the filters, sorting and layout of the connected user\'s last used view of an app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the unsaved "last" view the connected user sees when opening a Podio app: filters, sorting, layout and field settings. It affects only this user; to save a shared view use Create View. Read it back with Get View and "last". The app id comes from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app.' }),
    sortBy: podioAiProps.text({ required: false, displayName: 'Sort By', description: 'What to sort by: a field id or a special key such as "created_on" or "last_edit_on".' }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending.' }),
    filters: podioAiProps.json({
      required: false,
      displayName: 'Filters',
      description: 'The filters as a JSON array of {"key", "values"}, such as [{"key": 123, "values": [1]}] with a field id from Get App as key.',
    }),
    layout: podioAiProps.text({ required: false, displayName: 'Layout', description: 'The layout of the view, such as "table", "badge", "card" or "calendar".' }),
    fields: podioAiProps.json({
      required: false,
      displayName: 'Field Settings',
      description: 'Per-field display settings as a JSON object keyed by field id, such as {"123": {"hidden": true, "width": 200}}.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/view/app/${propsValue.appId}/last`,
      body: podioUtils.body({
        values: {
          sort_by: propsValue.sortBy,
          sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
          filters: propsValue.filters,
          layout: propsValue.layout,
          fields: propsValue.fields,
        },
      }),
    });
  },
});
