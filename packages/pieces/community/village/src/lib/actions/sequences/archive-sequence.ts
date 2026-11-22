import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const archiveSequence = createAction({
  auth: villageAuth,
  name: 'archive_sequence',
  classification: 'DESTRUCTIVE',
  displayName: 'Archive Sequence',
  description: 'Archive a sequence (sets its status to archived). Free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Archives an outreach sequence by ID, stopping it. Archiving an already-archived sequence succeeds again and leaves it archived.',
    idempotent: true,
  },
  outputSchema: villageSchemas.archiveSequence,
  props: {
    id: Property.ShortText({ displayName: 'Sequence ID', required: true }),
  },
  async run(context) {
    const id = villageApi.requireText({ value: context.propsValue.id, field: 'Sequence ID' });
    await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/v2/sequences/${villageApi.encodePathId(id)}`,
    });
    return { success: true, id };
  },
});
