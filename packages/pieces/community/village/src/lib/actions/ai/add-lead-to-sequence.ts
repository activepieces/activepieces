import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const addLeadToSequence = createAction({
  auth: villageAuth,
  name: 'add_lead_to_sequence',
  classification: 'WRITE',
  displayName: 'Add Lead to Sequence',
  description: 'Add one person to a sequence by Village person ID. With a connected mailbox, Village may email them within minutes. Free.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one person to an outreach sequence. sequence_id comes from Resolve Sequence by Name or List Sequences; person_id is the Village person ID from Find People. Sequences are active by default: once the user has a mailbox connected in Village, the first email to this person is scheduled within minutes, so confirm with the user first. Free. A person already in the sequence is reported as skipped, not added twice.',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiAddLeadToSequence,
  props: {
    sequence_id: Property.ShortText({ displayName: 'Sequence ID', required: true }),
    person_id: Property.ShortText({ displayName: 'Person ID', required: true }),
  },
  async run(context) {
    const sequenceId = villageApi.requireText({ value: context.propsValue.sequence_id, field: 'Sequence ID' });
    const personId = villageApi.requireText({ value: context.propsValue.person_id, field: 'Person ID' });
    const response = await villageApi.call<AddLeadsResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/sequences/${villageApi.encodePathId(sequenceId)}/leads`,
      body: { lead_identifiers: [personId] },
    });
    const added = response.data?.added_leads?.[0];
    const skipped = response.data?.skipped_leads?.[0];
    return {
      added: added !== undefined,
      sequence_id: sequenceId,
      lead_id: added?.id ?? null,
      status: added?.status ?? null,
      skipped_reason: skipped?.reason ?? null,
    };
  },
});

type AddLeadsResponse = {
  data?: {
    added_leads?: { id?: string; status?: string }[];
    skipped_leads?: { reason?: string }[];
  };
};
