import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';
import { workableValues } from '../common/values';

export const listJobQuestions = createAction({
  auth: workableAuth,
  name: 'list_job_questions',
  classification: 'READ',
  displayName: 'List Job Questions',
  description: 'Lists the application form questions of a job.',
  audience: 'both',
  aiMetadata: {
    description: 'List the application form questions of one Workable job (by shortcode) with key, text, type, whether required and the choices. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.questions,
  props: {
    account_subdomain: accountSubdomainProp,
    shortcode: Property.ShortText({ displayName: 'Job Shortcode', required: true }),
  },
  async run(context) {
    const client = workableOps.client({ auth: context.auth, subdomain: context.propsValue.account_subdomain });
    const shortcode = encodeId({ value: context.propsValue.shortcode, label: 'Job Shortcode' });
    const body = await client.request({ method: HttpMethod.GET, path: `/jobs/${shortcode}/questions` });
    const questions = workableValues.records(workableValues.rec(body)['questions']);
    return { questions, count: questions.length };
  },
});
