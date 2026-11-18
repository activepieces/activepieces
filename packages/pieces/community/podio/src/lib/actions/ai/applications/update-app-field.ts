import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioDeleteAppFieldOutputSchema } from '../../../output-schemas';

export const updateAppFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_update_app_field',
  outputSchema: podioDeleteAppFieldOutputSchema,
  displayName: 'Update App Field',
  description: 'Updates the configuration of an app field; settings left empty keep their current value.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the configuration of one field of a Podio app (label, description, position, settings, required); props left empty keep their current value, and the field type cannot change. Settings replace the whole settings object, so for a category field send every option, with the ids from Get App Field. The app id comes from List Apps or Get App, the field id from the fields of Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app that has the field.' }),
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of the field, from the fields of Get App.' }),
    label: podioAiProps.text({ required: false, displayName: 'Label', description: 'The new label users see for the field.' }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'The new help text shown when creating and editing items.' }),
    delta: podioAiProps.number({ required: false, displayName: 'Position', description: 'The order of the field among the other fields, lowest first.' }),
    settings: podioAiProps.json({
      required: false,
      displayName: 'Settings',
      description: 'The full type-specific settings as a JSON object, such as {"options": [{"id": 1, "text": "Open", "color": "DCEBD8"}], "multiple": false} for a category field.',
    }),
    mapping: podioAiProps.text({
      required: false,
      displayName: 'Mapping',
      description: 'For meeting apps: "meeting_time", "meeting_participants", "meeting_agenda" or "meeting_location".',
    }),
    required: podioAiProps.bool({ required: false, displayName: 'Required', description: '"true" makes the field required when creating and editing items.' }),
    hidden: podioAiProps.bool({ required: false, displayName: 'Hidden', description: '"true" hides the field in create, view and edit mode.' }),
  },
  async run({ auth, propsValue }) {
    const path = `/app/${propsValue.appId}/field/${propsValue.fieldId}`;
    const current = await podioApi.getAppField({ auth, appId: propsValue.appId, fieldId: propsValue.fieldId });
    const kept = Object.fromEntries(Object.entries(current.config).filter(([key]) => FIELD_CONFIG_KEYS.includes(key)));
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path,
      body: {
        ...kept,
        ...podioUtils.body({
          values: {
            label: propsValue.label,
            description: propsValue.description,
            delta: propsValue.delta,
            settings: propsValue.settings,
            mapping: propsValue.mapping,
            required: podioUtils.toBool({ value: propsValue.required }),
            hidden_create_view_edit: podioUtils.toBool({ value: propsValue.hidden }),
          },
        }),
      },
    });
  },
});

const FIELD_CONFIG_KEYS = ['label', 'description', 'delta', 'settings', 'mapping', 'required', 'hidden_create_view_edit'];
