import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi, VILLAGE_RELATIONSHIP_TYPE_OPTIONS } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const addRelationship = createAction({
  auth: villageAuth,
  name: 'add_relationship',
  classification: 'WRITE',
  displayName: 'Add Relationship',
  description: 'Add one person you know to your Village network. Free.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds or updates one manual relationship in the caller\'s network, by email or LinkedIn URL, with an optional strength score 0-10 and a type (met_in_person, worked_together, studied_together, attended_event, introduced_by_someone, other). Free. Repeating it updates the same relationship, it does not duplicate it.',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiAddRelationship,
  props: {
    identifier: Property.ShortText({
      displayName: 'Email or LinkedIn URL',
      required: true,
    }),
    score: Property.Number({ displayName: 'Score', description: '0-10.', required: false }),
    relationship_type: Property.StaticDropdown({
      displayName: 'Relationship Type',
      required: false,
      options: { options: VILLAGE_RELATIONSHIP_TYPE_OPTIONS },
    }),
  },
  async run(context) {
    const { score, relationship_type } = context.propsValue;
    const identifier = villageApi.requireText({ value: context.propsValue.identifier, field: 'Email or LinkedIn URL' });
    const person: Record<string, unknown> = { identifier };
    if (score !== undefined && score !== null) {
      if (score < 0 || score > 10) {
        throw new Error('Score must be between 0 and 10.');
      }
      person['score'] = score;
    }
    if (relationship_type) {
      person['user_relationship_type'] = relationship_type;
    }
    const response = await villageApi.call<RelationshipsResponse>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v2/user/relationships',
      body: { people: [person] },
    });
    const result = response.data?.results?.[0];
    const error = result?.error;
    return {
      identifier,
      status: result?.status ?? null,
      error: error === null || error === undefined ? null : JSON.stringify(error),
    };
  },
});

type RelationshipsResponse = {
  data?: { results?: { identifier?: string; status?: string; error?: unknown }[] };
};
