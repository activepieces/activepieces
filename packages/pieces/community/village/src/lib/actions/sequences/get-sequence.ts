import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getSequence = createAction({
  auth: villageAuth,
  name: 'get_sequence',
  classification: 'READ',
  displayName: 'Get Sequence',
  description: 'Get one sequence with its settings and stats. Free.',
  audience: 'both',
  aiMetadata: {
    description: 'Reads one outreach sequence by ID (status, approach, lead and email stats). Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.getSequence,
  props: {
    id: Property.ShortText({ displayName: 'Sequence ID', required: true }),
  },
  async run(context) {
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/sequences/${sequencePath(context.propsValue.id)}`,
    });
  },
});

function sequencePath(id: string | undefined): string {
  return villageApi.encodePathId(villageApi.requireText({ value: id, field: 'Sequence ID' }));
}
