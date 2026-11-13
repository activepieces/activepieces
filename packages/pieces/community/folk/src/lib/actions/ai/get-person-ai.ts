import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const getPersonAi = createAction({
  auth: folkAuth,
  name: 'get_person_ai',
  displayName: 'Get Person',
  description: 'Get one Folk person by ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: folkOutputSchemas.person,
  aiMetadata: {
    description:
      'Returns one Folk person by ID (per_...): names, job title, emails, phones, URLs, addresses, companies, groups, custom field values and interaction stats. Use Search People to find the ID from a name or email. Read-only.',
    idempotent: true,
  },
  props: {
    personId: folkAi.idProp({ displayName: 'Person ID', description: 'ID of the person (per_...).' }),
  },
  async run(context) {
    return folkClient.getData<Record<string, unknown>>({
      auth: context.auth,
      path: `/v1/people/${folkClient.idSegment({ value: context.propsValue.personId, label: 'Person ID' })}`,
    });
  },
});
