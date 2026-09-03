import { createAction } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';
import { formioProps } from '../common/props';
import { getFormOutputSchema } from '../common/output-schemas';

export const getForm = createAction({
  auth: formioAuth,
  name: 'get_form',
  displayName: 'Get Form',
  description: 'Read one form definition, including its components',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads a single Form.io form definition, including the component tree that describes its fields. Use it to discover which field keys a form expects before creating or updating a submission. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getFormOutputSchema,
  props: {
    formPath: formioProps.formPath,
  },
  async run({ auth, propsValue }) {
    return await formioCommon.getForm({
      auth: auth.props,
      formPath: propsValue.formPath,
    });
  },
});
