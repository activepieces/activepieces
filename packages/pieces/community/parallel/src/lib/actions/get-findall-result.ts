import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { parallelClient } from '../common/client';

export const getFindAllResultAction = createAction({
  auth: parallelAuth,
  name: 'get_findall_result',
  displayName: 'Get FindAll Result',
  description:
    'Return the current snapshot of matched candidates for a FindAll run, including any enrichment fields.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read the current snapshot of matched candidates and enrichment fields for a Parallel FindAll run by its id. Use it to poll or collect the entities discovered by Create FindAll Run; the run may still be in progress, so results can grow across calls. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    findall_id: Property.ShortText({
      displayName: 'FindAll ID',
      description: 'The FindAll run ID returned from Create FindAll Run.',
      required: true,
    }),
  },
  async run(context) {
    return await parallelClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1beta/findall/runs/${encodeURIComponent(context.propsValue.findall_id)}/result`,
    });
  },
});
