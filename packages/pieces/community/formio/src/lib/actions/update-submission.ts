import { createAction, Property } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';
import { formioProps } from '../common/props';
import { updateSubmissionOutputSchema } from '../common/output-schemas';

export const updateSubmission = createAction({
  auth: formioAuth,
  name: 'update_submission',
  displayName: 'Update Submission',
  description: 'Replace the data on an existing submission',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing Form.io submission, identified by its id. By default the fields supplied are merged into the submission, leaving every other field as it was. Turn Merge off to replace the submission data outright, which is what the Form.io API does natively and which clears any field not supplied. Merging reads the submission and writes it back, and Form.io cannot reject a write based on the version read, so two flows updating the same submission at the same time will lose one set of changes. Use it to correct or progress a record already in Form.io.',
    idempotent: true,
  },
  outputSchema: updateSubmissionOutputSchema,
  props: {
    formPath: formioProps.formPath,
    submissionId: formioProps.submissionId,
    data: formioProps.submissionData,
    merge: Property.Checkbox({
      displayName: 'Merge With Existing Data',
      description:
        'On by default: the fields above are merged into the submission and everything else is left alone. Turn it off to replace the submission data outright, which clears any field you do not supply.\n\nMerging reads the submission and writes it back, and Form.io offers no way to reject a write based on the version that was read. So if another flow or person changes the same submission during that moment, one of the two sets of changes is lost. Where several flows update one submission at once, have each write only the fields it owns with merge off, or serialise them.',
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
