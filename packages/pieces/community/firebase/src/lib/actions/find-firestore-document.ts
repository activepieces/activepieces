import { createAction, Property } from '@activepieces/pieces-framework';
import { firestoreAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { convertToFirestoreValues } from '../common/props';

interface QueryFilter {
  fieldFilter?: {
    field: { fieldPath: string };
    op: string;
    value: unknown;
  };
  compositeFilter?: {
    op: string;
    filters: QueryFilter[];
  };
}

export const findFirestoreDocument = createAction({
  auth: firestoreAuth,
  name: 'findFirestoreDocument',
  displayName: 'Query Firestore Documents',
  description:
    'Query and find documents in a Firestore collection with filters',
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your Firebase project ID',
      required: true,
    }),
    databaseId: Property.ShortText({
      displayName: 'Database ID',
      description: 'Database ID (default is "(default)")',
      required: false,
      defaultValue: '(default)',
    }),
    collectionPath: Property.ShortText({
      displayName: 'Collection Path',
      description:
        'Path to the collection to query (e.g., "users" or "users/user1/posts"). Optional when providing a full `structuredQuery` JSON.',
      required: false,
    }),

    filterField: Property.ShortText({
      displayName: 'Filter Field',
      description: 'Field name to filter on (e.g., "name" or "age")',
      required: false,
    }),

    filterValue: Property.Json({
      displayName: 'Filter Value',
      description:
        'Value to filter by. Accepts JSON (objects/arrays) or primitive values.',
      required: false,
    }),

    structuredQuery: Property.Json({
      displayName: 'Structured Query (optional)',
      description:
        'Full `structuredQuery` JSON object to send directly to the Firestore API. If provided, this overrides other query props. Accepts either `{ "structuredQuery": { ... } }` or the inner `structuredQuery` object.',
      required: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      databaseId,
      collectionPath,
      filterField,
      filterValue,
      structuredQuery,
    } = context.propsValue;

    const LIMIT = 10;
    const OFFSET = 0;
    const ORDER_BY_FIELD = 'another_field';
    const ORDER_DIRECTION = 'ASCENDING';

    const parent = `projects/${projectId}/databases/${databaseId}/documents`;

    let queryObject: any;
    if (structuredQuery) {
      if (structuredQuery['structuredQuery']) {
        queryObject = structuredQuery;
      } else {
        queryObject = { structuredQuery: structuredQuery };
      }
    } else {
      queryObject = {
        structuredQuery: {
          from: [{ collectionId: collectionPath }],
        },
      };
    }

    if (filterField && filterValue !== undefined && filterValue !== null) {
      const value: unknown = filterValue;
      if (!structuredQuery) {
        queryObject.structuredQuery.where = {
          fieldFilter: {
            field: { fieldPath: filterField },
            op: 'EQUAL',
            value: convertToFirestoreValues(value),
          },
        };
      }
    }
    if (!structuredQuery) {
      queryObject.structuredQuery.orderBy = [
        {
          field: { fieldPath: ORDER_BY_FIELD },
          direction: ORDER_DIRECTION,
        },
      ];
      queryObject.structuredQuery.limit = LIMIT;
      queryObject.structuredQuery.offset = OFFSET;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://firestore.googleapis.com/v1/${parent}:runQuery`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryObject),
    });

    return response.body;
  },
});
