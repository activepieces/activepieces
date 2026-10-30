import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsForm } from '../../common/types';
import { gravityformsCreateFormOutputSchema } from '../../output-schemas';

export const createFormAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_create_form',
  outputSchema: gravityformsCreateFormOutputSchema,
  displayName: 'Create Form',
  description: 'Creates a form with the given title and fields.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new form. Fields are Gravity Forms Field Objects, e.g. [{"id":1,"type":"text","label":"Name"}]; copy the shape from Get Form on an existing form. Not idempotent: each call creates another form.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Form title, unique on the site.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Form description shown under the title.',
      required: false,
    }),
    fields: Property.Json({
      displayName: 'Fields',
      description: 'Array of Field Objects, e.g. [{"id":1,"type":"text","label":"Name","isRequired":true}]. Each field needs a unique numeric id.',
      required: true,
    }),
    additionalProperties: Property.Json({
      displayName: 'Additional Properties',
      description: 'Other Form Object properties to set, e.g. {"labelPlacement":"top_label","button":{"type":"text","text":"Send"}}. Defaults to none.',
      required: false,
    }),
  },
  async run(context) {
    const { title, description, fields, additionalProperties } = context.propsValue;
    return await gravityFormsClient.request<GravityFormsForm>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/forms',
      body: { ...additionalProperties, title, description, fields },
    });
  },
});
