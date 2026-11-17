import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listWorkOverlaps = createAction({
  auth: villageAuth,
  name: 'list_work_overlaps',
  classification: 'SEARCH',
  displayName: 'List Work Overlaps',
  description: 'List people you (or your first-degree connections) worked with at the same company at the same time. Free.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists former colleagues: people whose employment overlapped with the caller ("own") or with the caller\'s first-degree connections ("network"), with companies and overlap months. Free. Cursor-paginated (pagination.cursor), read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listWorkOverlaps,
  props: {
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description: 'own (default): people you overlapped with. network: people your first-degree connections overlapped with.',
      required: false,
      options: {
        options: [
          { label: 'Own', value: 'own' },
          { label: 'Network', value: 'network' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Results per page (1-100, default 25).',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'pagination.cursor from a previous call.',
      required: false,
    }),
  },
  async run(context) {
    const { scope, limit, cursor } = context.propsValue;
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/user/work-overlaps',
      queryParams: {
        scope: scope ?? undefined,
        limit: String(villageApi.clampLimit({ value: limit, max: 100, fallback: 25 })),
        cursor: cursor ?? undefined,
      },
    });
  },
});
