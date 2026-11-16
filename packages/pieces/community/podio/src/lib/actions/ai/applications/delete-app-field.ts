import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioDeleteAppFieldOutputSchema } from '../../../output-schemas';

export const deleteAppFieldAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_app_field',
  outputSchema: podioDeleteAppFieldOutputSchema,
  displayName: 'Delete App Field',
  description: 'Deletes a field from an app, optionally deleting the values stored in it.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a field from a Podio app so new items and edits no longer have it; existing items still show their old value unless Delete Values is "true", which removes those values for good. Returns the new app revision. The app id comes from List Apps or Get App, the field id from the fields of Get App.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app that has the field.' }),
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of the field to delete, from the fields of Get App.' }),
    deleteValues: podioAiProps.bool({
      required: false,
      displayName: 'Delete Values',
      description: '"true" also deletes the values existing items hold in this field. Defaults to "false".',
    }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/app/${propsValue.appId}/field/${propsValue.fieldId}`,
      query: podioUtils.query({ values: { delete_values: podioUtils.toBool({ value: propsValue.deleteValues }) } }),
    });
  },
});
