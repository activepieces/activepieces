import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { workableAuth } from '../auth';
import { encodeId } from '../common/client';
import { workableOps } from '../common/operations';
import { accountSubdomainProp } from '../common/props';
import { workableSchemas } from '../common/schemas';

export const getJob = createAction({
  auth: workableAuth,
  name: 'getJob',
  classification: 'READ',
  displayName: 'Get Job',
  description: 'Gets the details of a job.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch one Workable job by its shortcode, with title, state, department, location and URLs; turn on Include Description for the description, requirements and benefits. Find shortcodes with List Jobs. Read-only.',
    idempotent: true,
  },
  outputSchema: workableSchemas.job,
  props: {
    account_subdomain: accountSubdomainProp,
    shortcode: Property.ShortText({
      displayName: 'Job Shortcode',
      description: 'Shortcode of the job, for example "GROOV005". Find it with List Jobs.',
      required: true,
    }),
    include_description: Property.Checkbox({
      displayName: 'Include Description',
      description: 'Also return the description, requirements and benefits.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = workableOps.client({ auth: context.auth, subdomain: context.propsValue.account_subdomain });
    const shortcode = encodeId({ value: context.propsValue.shortcode, label: 'Job Shortcode' });
    const body = await client.request({
      method: HttpMethod.GET,
      path: `/jobs/${shortcode}`,
      query: { include_fields: context.propsValue.include_description === true ? 'description,requirements,benefits' : undefined },
    });
    return workableOps.unwrap({ body, key: 'job' });
  },
});
