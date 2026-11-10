import { createAction } from '@activepieces/pieces-framework';
import { folkAi } from '../../common/ai-common';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const deletePerson = createAction({
  auth: folkAuth,
  name: 'delete_person',
  displayName: 'Delete Person',
  description: 'Delete a person from Folk.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  outputSchema: folkOutputSchemas.deletedPerson,
  aiMetadata: {
    description:
      'Permanently deletes one Folk person by ID (per_...). Cannot be undone; confirm the ID with Get Person first. A second call for the same ID fails with not found.',
    idempotent: false,
  },
  props: {
    personId: folkAi.idProp({ displayName: 'Person ID', description: 'ID of the person to delete (per_...).' }),
  },
  async run(context) {
    const id = folkClient.idSegment({ value: context.propsValue.personId, label: 'Person ID' });
    return folkAi.deleteRecord({ auth: context.auth, path: `/v1/people/${id}`, id });
  },
});
