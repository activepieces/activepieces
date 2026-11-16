import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioGetAppFieldOutputSchema } from '../../../output-schemas';

export const getAppFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_field',
  outputSchema: podioGetAppFieldOutputSchema,
  displayName: 'Get App Field',
  description: 'Gets one field of an app, by field id or external id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one field of a Podio app, with its type, external id and configuration (label, settings such as category options, required flag). Get App returns all fields at once; use this for a single field. The app id comes from List Apps or Get App, the field id or external id from the fields of Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app that has the field.' }),
    fieldOrExternalId: podioAiProps.text({
      required: true,
      displayName: 'Field ID or External ID',
      description: 'The numeric field id or the external id (such as "title") of the field, from the fields of Get App.',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.getAppField({ auth, appId: propsValue.appId, fieldId: propsValue.fieldOrExternalId });
  },
});
