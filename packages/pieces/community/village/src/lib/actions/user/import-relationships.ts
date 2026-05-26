import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

const MAX_RELATIONSHIPS_PER_REQUEST = 1000;
const MIN_SCORE = 0;
const MAX_SCORE = 10;

const USER_RELATIONSHIP_TYPE_OPTIONS = [
  { label: 'Met in person', value: 'met_in_person' },
  { label: 'Worked together', value: 'worked_together' },
  { label: 'Studied together', value: 'studied_together' },
  { label: 'Attended event', value: 'attended_event' },
  { label: 'Introduced by someone', value: 'introduced_by_someone' },
];

type PersonRow = {
  identifier?: string;
  score?: number;
  user_relationship_type?: string;
};

export const importRelationships = createAction({
  auth: villageAuth,
  name: 'import_relationships',
  displayName: 'Import Relationships',
  description:
    "Import manual relationships to expand your network graph — useful for adding people you know but aren't connected to digitally. Provide email addresses or LinkedIn URLs with optional scores (0-10); higher scores indicate stronger relationships. Max 1000 per request.",
  props: {
    people: Property.Array({
      displayName: 'People',
      description:
        'Up to 1000 people to import. Each row: identifier (email or LinkedIn URL), optional score (0-10), optional relationship type.',
      required: true,
      defaultValue: [],
      properties: {
        identifier: Property.ShortText({
          displayName: 'Identifier',
          description: 'Email address or LinkedIn URL',
          required: true,
        }),
        score: Property.Number({
          displayName: 'Score',
          description: `Relationship score (${MIN_SCORE}-${MAX_SCORE}). Falls back to "Default Score" or the system default.`,
          required: false,
        }),
        user_relationship_type: Property.StaticDropdown({
          displayName: 'Relationship Type',
          description: 'Optional category for how you know this person',
          required: false,
          options: {
            options: USER_RELATIONSHIP_TYPE_OPTIONS,
          },
        }),
      },
    }),
    min_score: Property.Number({
      displayName: 'Default Score',
      description: `Default score (${MIN_SCORE}-${MAX_SCORE}) applied to rows without an explicit score.`,
      required: false,
    }),
  },
  async run(context) {
    const { people, min_score } = context.propsValue;

    const rows = (people ?? []) as PersonRow[];

    if (rows.length === 0) {
      throw new Error('At least one person is required');
    }
    if (rows.length > MAX_RELATIONSHIPS_PER_REQUEST) {
      throw new Error(
        `Maximum ${MAX_RELATIONSHIPS_PER_REQUEST} people allowed per request (got ${rows.length})`,
      );
    }

    if (min_score !== undefined && min_score !== null) {
      if (min_score < MIN_SCORE || min_score > MAX_SCORE) {
        throw new Error(
          `Default Score must be between ${MIN_SCORE} and ${MAX_SCORE} (got ${min_score})`,
        );
      }
    }

    const peoplePayload = rows.map((row, index) => {
      const identifier = (row.identifier ?? '').trim();
      if (!identifier) {
        throw new Error(`people[${index}].identifier is required`);
      }
      const item: Record<string, unknown> = { identifier };
      if (row.score !== undefined && row.score !== null) {
        if (row.score < MIN_SCORE || row.score > MAX_SCORE) {
          throw new Error(
            `people[${index}].score must be between ${MIN_SCORE} and ${MAX_SCORE} (got ${row.score})`,
          );
        }
        item['score'] = row.score;
      }
      if (row.user_relationship_type) {
        item['user_relationship_type'] = row.user_relationship_type;
      }
      return item;
    });

    const body: Record<string, unknown> = { people: peoplePayload };
    if (min_score !== undefined && min_score !== null) {
      body['min_score'] = min_score;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/user/relationships`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body,
    });
    return response.body;
  },
});
