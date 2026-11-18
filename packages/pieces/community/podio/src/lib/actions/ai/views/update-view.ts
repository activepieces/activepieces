import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const updateViewAction = createAction({
  auth: podioAuth,
  name: 'podio_update_view',
  displayName: 'Update View',
  description: 'Updates a saved view: its name, filters, sorting, layout, field settings or grouping.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a saved view of a Podio app; only the props you set are sent. Filters replace the view\'s whole filter list, so read the current ones with Get View first when adding one. The view id comes from List Views or Create View.',
    idempotent: true,
  },
  props: {
    viewId: podioAiProps.id({ required: true, displayName: 'View ID', description: 'The id of the view to update.' }),
    name: podioAiProps.text({ required: false, displayName: 'Name', description: 'The new name of the view.' }),
    private: podioAiProps.bool({ required: false, displayName: 'Private', description: '"true" makes the view visible only to its creator.' }),
    sortBy: podioAiProps.text({ required: false, displayName: 'Sort By', description: 'What to sort by: a field id or a special key such as "created_on" or "last_edit_on".' }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending.' }),
    filters: podioAiProps.json({
      required: false,
      displayName: 'Filters',
      description: 'The full filter list as a JSON array of {"key", "values"}, such as [{"key": 123, "values": [1]}] with a field id from Get App as key.',
    }),
    layout: podioAiProps.text({ required: false, displayName: 'Layout', description: 'The layout of the view, such as "table", "badge", "card" or "calendar".' }),
    fields: podioAiProps.json({
      required: false,
      displayName: 'Field Settings',
      description: 'Per-field display settings as a JSON object keyed by field id, such as {"123": {"hidden": true, "width": 200}}.',
    }),
    grouping: podioAiProps.json({
      required: false,
      displayName: 'Grouping',
      description: 'The grouping as a JSON object, such as {"type": "field", "value": 123} or {"type": "revision", "value": "created_on", "sub_value": "month"}.',
    }),
  },
  async run({ auth, propsValue }) {
    const body = podioUtils.body({
      values: {
        name: propsValue.name,
        private: podioUtils.toBool({ value: propsValue.private }),
        sort_by: propsValue.sortBy,
        sort_desc: podioUtils.toBool({ value: propsValue.sortDesc }),
        filters: propsValue.filters,
        layout: propsValue.layout,
        fields: propsValue.fields,
        grouping: propsValue.grouping,
      },
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of Name, Private, Sort By, Sort Descending, Filters, Layout, Field Settings or Grouping.');
    }
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/view/${propsValue.viewId}`, body });
  },
});
