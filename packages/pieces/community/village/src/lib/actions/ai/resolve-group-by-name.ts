import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, NamedItem } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const resolveGroupByName = createAction({
  auth: villageAuth,
  name: 'resolve_group_by_name',
  classification: 'READ',
  displayName: 'Resolve Group by Name',
  description: 'Find the ID of one of your Village groups by its name. Free.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Turns a group name into its group ID among the groups the caller belongs to (case-insensitive exact match). found=false with other_matches listing partial matches when there is no exact match. Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiResolveByName,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const name = villageApi.requireText({ value: context.propsValue.name, field: 'Name' });
    const response = await villageApi.call<{ data?: { groups?: { id: string; name: string }[] } }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/groups',
    });
    const items: NamedItem[] = (response.data?.groups ?? []).map((group) => ({ id: String(group.id), name: group.name ?? '' }));
    return villageApi.matchByName({ items, name });
  },
});

