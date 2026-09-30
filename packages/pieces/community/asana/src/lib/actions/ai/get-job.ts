import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaJobOutputSchema } from '../../output-schemas';

export const asanaGetJobAction = createAction({
  auth: asanaAuth,
  name: 'get_job',
  classification: 'READ',
  displayName: 'Get Job',
  description: 'Check the status of an asynchronous Asana job.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the current status of an asynchronous job started by Duplicate Task or Duplicate Project: not_started, in_progress, succeeded or failed, plus the new_task or new_project it produced. A single status read, not a wait; call it again later while the job is still running. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaJobOutputSchema,
  props: {
    job: Property.ShortText({
      displayName: 'Job GID',
      description: 'Gid of the job returned by Duplicate Task or Duplicate Project.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/jobs/${asanaUtils.pathSegment(context.propsValue.job)}`,
      operation: 'Get Job',
      query: { opt_fields: ASANA_FIELDS.job },
    });
  },
});
