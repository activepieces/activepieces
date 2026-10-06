import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieFields } from '../common/fields';
import { moxieInput, moxieProps, moxieBody } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieCreateFormSubmissionAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_form_submission',
  classification: 'WRITE',
  displayName: 'Submit Lead Form',
  description: 'Submit a Moxie lead or discovery form, which adds a lead to the pipeline.',
  audience: 'both',
  aiMetadata: {
    description:
      'Submits a Moxie lead or discovery form by exact form name with the lead contact details and answers, which creates a pipeline lead the same way a website submission does. Use to push leads from other forms or tools into the Moxie pipeline; form names come from List Form Names. Not idempotent: each call creates another submission and lead.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.formSubmission,
  props: {
    formName: Property.ShortText({
      displayName: 'Form Name',
      description: 'Exact form name, from List Form Names.',
      required: true,
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.formSubmission, audience: 'ai' }),
    answers: Property.Array({
      displayName: 'Answers',
      description: 'Question and answer pairs to store on the submission.',
      required: false,
      properties: {
        question: Property.ShortText({ displayName: 'Question', required: true }),
        answer: Property.LongText({ displayName: 'Answer', required: false }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const answers = (moxieInput.recordList({ value: propsValue.answers, field: 'Answers' }) ?? []).map((row) =>
      moxieInput.compact({
        values: {
          question: moxieInput.requiredText({ value: row['question'], field: 'Answer question' }),
          answer: moxieInput.text({ value: row['answer'] }),
        },
      }),
    );
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.POST,
      path: '/action/formSubmissions/create',
      body: {
        formName: moxieInput.requiredText({ value: propsValue.formName, field: 'Form Name' }),
        ...moxieBody.fromSpecs({ specs: moxieFields.formSubmission, values: propsValue }),
        ...(answers.length === 0 ? {} : { answers }),
      },
      notFoundMessage: 'Moxie could not find that form or pipeline stage. Names must match exactly.',
    });
  },
});
