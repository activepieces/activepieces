import { createAction, Property } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';
import { formioProps } from '../common/props';

export const updateSubmission = createAction({
  auth: formioAuth,
  name: 'update_submission',
  displayName: 'Update Submission',
  description: 'Replace the data on an existing submission',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing Form.io submission, identified by its id. By default the fields supplied are merged into the submission, leaving every other field as it was. Turn Merge off to replace the submission data outright, which is what the Form.io API does natively and which clears any field not supplied. Use it to correct or progress a record already in Form.io.',
    idempotent: true,
  },
  props: {
    formPath: formioProps.formPath,
    submissionId: formioProps.submissionId,
    data: formioProps.submissionData,
    merge: Property.Checkbox({
      displayName: 'Merge With Existing Data',
      description:
        'On by default: the fields above are merged into the submission and everything else is left alone. Turn it off to replace the submission data outright, which clears any field you do not supply. Merging reads the submission first, so it costs one extra request.',
      required: false,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await formioCommon.updateSubmission({
      auth: auth.props,
      formPath: propsValue.formPath,
      submissionId: propsValue.submissionId,
      data: propsValue.data as Record<string, unknown>,
      merge: propsValue.merge !== false,
    });
  },
});
