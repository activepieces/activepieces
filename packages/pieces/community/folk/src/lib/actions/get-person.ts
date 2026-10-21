import { createAction } from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkOutputSchemas } from '../output-schemas';
import { folkClient } from '../common/client';
import { folkProps } from '../common/props';

export const getPerson = createAction({
  auth: folkAuth,
  name: 'getPerson',
  classification: 'READ',
  displayName: 'Get Person',
  description: 'Retrieve detailed information about a person from your Folk workspace.',
  audience: 'human',
  outputSchema: folkOutputSchemas.legacyPersonWrite,
  aiMetadata: {
    description: 'Fetches the full record of a single Folk person (contact) by their person ID. Use when you already have the person ID and need their current details; if you only have a name or email, find the ID first with List People. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    personId: folkProps.person_id(true),
  },
  async run(context) {
    const data = await folkClient.getData<Record<string, unknown>>({
      auth: context.auth,
      path: `/v1/people/${folkClient.idSegment({ value: String(context.propsValue.personId ?? ''), label: 'Person' })}`,
    });
    return { data, success: true };
  },
});
