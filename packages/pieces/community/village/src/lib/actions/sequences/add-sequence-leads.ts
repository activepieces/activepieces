import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const addSequenceLeads = createAction({
  auth: villageAuth,
  name: 'add_sequence_leads',
  classification: 'WRITE',
  displayName: 'Add Leads to Sequence',
  description:
    'Add up to 100 people to a sequence by their Village person IDs (for example the ID from Search People). Sequences are active by default, so once a mailbox is connected in Village the first email to each lead is scheduled within minutes. Free.',
  audience: 'human',
  aiMetadata: {
    description: 'Adds up to 100 people (Village person IDs) to a sequence. Sequences are active by default, so with a connected mailbox Village starts emailing them within minutes. People already in it are reported as skipped.',
    idempotent: true,
  },
  outputSchema: villageSchemas.addSequenceLeads,
  props: {
    sequence_id: Property.ShortText({ displayName: 'Sequence ID', required: true }),
    lead_identifiers: Property.Array({
      displayName: 'Person IDs',
      description: 'Village person IDs, one per row (max 100).',
      required: true,
    }),
  },
  async run(context) {
    const { sequence_id, lead_identifiers } = context.propsValue;
    const ids = villageApi.stringList(lead_identifiers);
    if (ids.length === 0) {
      throw new Error('Add at least one person ID.');
    }
    if (ids.length > 100) {
      throw new Error('Add at most 100 person IDs per call.');
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/sequences/${sequencePath(sequence_id)}/leads`,
      body: { lead_identifiers: ids },
    });
  },
});

function sequencePath(id: string | undefined): string {
  return villageApi.encodePathId(villageApi.requireText({ value: id, field: 'Sequence ID' }));
}
