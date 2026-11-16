import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetFieldRangesOutputSchema } from '../../../output-schemas';

export const getFieldRangesAction = createAction({
  auth: podioAuth,
  name: 'podio_get_field_ranges',
  outputSchema: podioGetFieldRangesOutputSchema,
  displayName: 'Get Field Ranges',
  description: 'Gets the minimum and maximum value of a number, calculation or money field.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Returns the minimum and maximum value of a number, calculation or money field across the app's items. The field id comes from Get App.",
    idempotent: true,
  },
  props: {
    fieldId: podioAiProps.id({ required: true, displayName: 'Field ID', description: 'The id of a number, calculation or money field, from Get App.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/item/field/${propsValue.fieldId}/range` });
  },
});
