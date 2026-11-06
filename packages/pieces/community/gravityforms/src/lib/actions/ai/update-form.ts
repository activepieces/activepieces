import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsApi } from '../../common/api';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsForm } from '../../common/types';
import { gravityformsUpdateFormOutputSchema } from '../../output-schemas';

export const updateFormAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_update_form',
  outputSchema: gravityformsUpdateFormOutputSchema,
  displayName: 'Update Form',
  description: 'Changes a form\'s title, description, fields or other properties.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a form by id. Reads the current form, applies only the properties you set, and saves the whole form; Fields, when given, replaces the full field list. Form ids come from List Forms.',
    idempotent: true,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New form title. Leave empty to keep it.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New form description. Leave empty to keep it.',
      required: false,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Full array of Field Objects that replaces the current fields. Get it from Get Form, edit it, and send it back. Leave empty to keep the fields.',
      required: false,
    }),
    additionalProperties: Property.Json({
      displayName: 'Additional Properties',
      description: 'Other Form Object properties to change, e.g. {"labelPlacement":"left_label"}. Defaults to none.',
      required: false,
    }),
  },
  async run(context) {
    const { formId, title, description, fields, additionalProperties } = context.propsValue;
    const current = await gravityFormsApi.getForm({ auth: context.auth, formId });
    return await gravityFormsClient.request<GravityFormsForm>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/forms/${encodeURIComponent(formId)}`,
      body: {
        ...current,
        ...additionalProperties,
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(fields !== undefined ? { fields } : {}),
      },
    });
  },
});
