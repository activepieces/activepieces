import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateAppFieldOutputSchema } from '../../../output-schemas';

export const createAppFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_create_app_field',
  outputSchema: podioCreateAppFieldOutputSchema,
  displayName: 'Create App Field',
  description: 'Adds a new field to an app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one field to a Podio app and returns its field_id; the type cannot be changed later, only the configuration through Update App Field. The app id comes from List Apps, List Apps in Space or Get App.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to add the field to.' }),
    type: podioAiProps.text({
      required: true,
      displayName: 'Type',
      description: 'The field type, such as text, number, date, category, app, contact, money, progress, location, duration, email, phone, link, image or calculation.',
    }),
    label: podioAiProps.text({ required: true, displayName: 'Label', description: 'The label users see for the field.' }),
    description: podioAiProps.longText({ required: false, displayName: 'Description', description: 'Help text shown when creating and editing items.' }),
    delta: podioAiProps.number({ required: false, displayName: 'Position', description: 'The order of the field among the other fields, lowest first.' }),
    settings: podioAiProps.json({
      required: false,
      displayName: 'Settings',
      description: 'Type-specific settings as a JSON object, such as {"options": [{"text": "Open", "color": "DCEBD8"}], "multiple": false} for a category field or {"referenced_apps": [{"app_id": 123}]} for an app field.',
    }),
    mapping: podioAiProps.text({
      required: false,
      displayName: 'Mapping',
      description: 'For meeting apps, the meeting role of the field: "meeting_time", "meeting_participants", "meeting_agenda" or "meeting_location".',
    }),
    required: podioAiProps.bool({ required: false, displayName: 'Required', description: '"true" makes the field required when creating and editing items. Defaults to "false".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/app/${propsValue.appId}/field/`,
      body: {
        type: propsValue.type,
        config: podioUtils.body({
          values: {
            label: propsValue.label,
            description: propsValue.description,
            delta: propsValue.delta,
            settings: propsValue.settings,
            mapping: propsValue.mapping,
            required: podioUtils.toBool({ value: propsValue.required }),
          },
        }),
      },
    });
  },
});
