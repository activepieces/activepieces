import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateViewOutputSchema } from '../../../output-schemas';

export const createViewAction = createAction({
  auth: podioAuth,
  name: 'podio_create_view',
  outputSchema: podioCreateViewOutputSchema,
  displayName: 'Create View',
  description: 'Creates a saved view (filters, sorting, layout, grouping) on an app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a saved view on a Podio app from filters, sorting, layout and grouping, and returns its view_id for Filter Items by View, Update View or Set Default View. The app id comes from List Apps or Get App; filter keys are field ids from Get App.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to add the view to.' }),
    name: podioAiProps.text({ required: true, displayName: 'Name', description: 'The name of the view.' }),
    private: podioAiProps.bool({ required: false, displayName: 'Private', description: '"true" makes the view visible only to its creator. Defaults to "false".' }),
    sortBy: podioAiProps.text({ required: false, displayName: 'Sort By', description: 'What to sort by: a field id or a special key such as "created_on" or "last_edit_on".' }),
    sortDesc: podioAiProps.bool({ required: false, displayName: 'Sort Descending', description: '"true" sorts descending.' }),
    filters: podioAiProps.json({
      required: false,
      displayName: 'Filters',
      description: 'The filters as a JSON array of {"key", "values"}, such as [{"key": 123, "values": [1]}] for a category field or [{"key": "created_by", "values": [{"type": "user", "id": 456}]}].',
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
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/view/app/${propsValue.appId}/`,
      body: podioUtils.body({
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
      }),
    });
  },
});
