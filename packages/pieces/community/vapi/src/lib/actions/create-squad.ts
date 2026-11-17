import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

function parseIdList(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Member Assistant IDs must be a list of assistant IDs or a JSON array such as ["id1","id2"].');
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
  }
  if (value === undefined || value === null) {
    return [];
  }
  throw new Error('Member Assistant IDs must be a list of assistant IDs or a JSON array such as ["id1","id2"].');
}

export const createSquad = createAction({
  auth: vapiAuth,
  name: 'create_squad',
  classification: 'WRITE',
  displayName: 'Create Squad',
  description: 'Create a squad: a group of assistants that can hand a call to each other. The first assistant starts the call.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.squad,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    assistantIds: Property.Array({
      displayName: 'Member Assistant IDs',
      description: 'IDs of the assistants in the squad, in order. The first one answers the call.',
      required: true,
    }),
  },
  async run(context) {
    const { name, assistantIds } = context.propsValue;
    const ids = parseIdList(assistantIds)
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value) => value !== '');
    if (ids.length === 0) {
      throw new Error('Add at least one Member Assistant ID.');
    }
    for (const id of ids) {
      vapiUtils.requireId({ value: id, fieldName: 'Member Assistant ID' });
    }
    const squad = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/squad',
      operation: 'create squad',
      body: { name: name.trim(), members: ids.map((assistantId) => ({ assistantId })) },
    });
    return vapiUtils.stripSecrets(squad);
  },
});
