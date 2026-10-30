import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsApi } from '../../common/api';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsEntry } from '../../common/types';
import { gravityformsGetEntryOutputSchema } from '../../output-schemas';

export const updateEntryAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_update_entry',
  outputSchema: gravityformsGetEntryOutputSchema,
  displayName: 'Update Entry',
  description: 'Changes some of an entry\'s field values or properties.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an entry by id. Reads the current entry, applies only the field values and properties you set, and saves the whole entry, so other values are kept. Entry ids come from List Entries, field ids from Get Form.',
    idempotent: true,
  },
  props: {
    entryId: gravityFormsAiProps.entryId({ required: true }),
    fieldValues: gravityFormsAiProps.fieldValues({
      required: false,
      description: 'Object of field ids to new values, e.g. {"1":"Jane","2.3":"Doe"}. Fields not listed keep their value. Defaults to none.',
    }),
    entryProperties: gravityFormsAiProps.entryProperties({ required: false }),
  },
  async run(context) {
    const { entryId, fieldValues, entryProperties } = context.propsValue;
    const current = await gravityFormsApi.getEntry({ auth: context.auth, entryId });
    return await gravityFormsClient.request<GravityFormsEntry>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/entries/${encodeURIComponent(entryId)}`,
      body: { ...current, ...entryProperties, ...fieldValues },
    });
  },
});
