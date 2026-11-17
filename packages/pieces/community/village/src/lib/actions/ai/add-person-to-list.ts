import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const addPersonToList = createAction({
  auth: villageAuth,
  name: 'add_person_to_list',
  classification: 'WRITE',
  displayName: 'Add Person to List',
  description: 'Add one person or company to a Village list. Free.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one entry to an existing list by list ID (get it from Resolve List by Name or List Lists). identifier is a LinkedIn profile URL, email, company domain or Village graph ID. Free. Re-adding an entry already on the list does not duplicate it. Returns added=false with the error when Village cannot resolve the identifier.',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiAddPersonToList,
  props: {
    list_id: Property.ShortText({ displayName: 'List ID', required: true }),
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description: 'LinkedIn URL, email, company domain or graph ID.',
      required: true,
    }),
  },
  async run(context) {
    const listId = villageApi.requireText({ value: context.propsValue.list_id, field: 'List ID' });
    const identifier = villageApi.requireText({ value: context.propsValue.identifier, field: 'Identifier' });
    const response = await villageApi.call<AddItemsResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/lists/${villageApi.encodePathId(listId)}/items`,
      body: { items: [{ identifier }] },
    });
    const result = response.data?.results?.[0];
    const error = result?.error ?? null;
    return {
      added: result !== undefined && (error === null || error === undefined),
      list_id: listId,
      identifier,
      item_id: readId(result?.item),
      error: error === null || error === undefined ? null : JSON.stringify(error),
    };
  },
});

function readId(item: unknown): string | null {
  if (typeof item === 'object' && item !== null && 'id' in item) {
    const id = item.id;
    return typeof id === 'string' || typeof id === 'number' ? String(id) : null;
  }
  return null;
}

type AddItemsResponse = {
  data?: { results?: { identifier?: string; item?: unknown; error?: unknown }[] };
};
