import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_RELATIONSHIP_TYPE_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const importRelationshipsFromList = createAction({
  auth: villageAuth,
  name: 'import_relationships_from_list',
  classification: 'WRITE',
  displayName: 'Import Relationships from List',
  description:
    'Queue a background import of the people on a Village people list as your relationships. Free. Returns a job ID; the import finishes later.',
  audience: 'both',
  aiMetadata: {
    description:
      'Queues a backend job that adds every person on a people list (list_id) to the caller\'s relationships with an optional score (0-10, default 5) and relationship type. Free. Returns a job_id immediately. Re-running queues another job; existing relationships are updated, not duplicated.',
    idempotent: true,
  },
  outputSchema: villageSchemas.importRelationshipsFromList,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'ID of a people list.',
      required: true,
    }),
    score: Property.Number({
      displayName: 'Score',
      description: 'Relationship score 0-10 (default 5).',
      required: false,
    }),
    relationship_type: Property.StaticDropdown({
      displayName: 'Relationship Type',
      required: false,
      options: { options: VILLAGE_RELATIONSHIP_TYPE_OPTIONS },
    }),
  },
  async run(context) {
    const { list_id, score, relationship_type } = context.propsValue;
    const body: Record<string, unknown> = {
      list_id: villageApi.requireText({ value: list_id, field: 'List ID' }),
      selection: { mode: 'all' },
    };
    if (score !== undefined && score !== null) {
      if (score < 0 || score > 10) {
        throw new Error('Score must be between 0 and 10.');
      }
      body['score'] = score;
    }
    if (relationship_type) {
      body['relationship_type'] = relationship_type;
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/user/relationships/import-from-list',
      body,
    });
  },
});
