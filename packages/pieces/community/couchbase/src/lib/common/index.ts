import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import couchbase, { Scope } from 'couchbase';
import { couchbaseAuth } from '../..';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest, HttpResponse,
  QueryParams,
} from '@activepieces/pieces-common';

export const apiGet = (auth: PiecePropValueSchema<typeof couchbaseAuth>, statement: string, args: string[] = []):HttpRequest => apiQuery(HttpMethod.GET, auth, statement, args);
export const apiPost = (auth: PiecePropValueSchema<typeof couchbaseAuth>, statement: string, args: string[] = []):HttpRequest => apiQuery(HttpMethod.POST, auth, statement, args);

const apiQuery = (method: HttpMethod, auth: PiecePropValueSchema<typeof couchbaseAuth>, statement: string, args: string[] = []):HttpRequest => {

  const params: QueryParams = {
    statement: statement,
    query_context: "default:" + auth.bucket + "." + auth.scope,
    args: JSON.stringify(args),
  }

  console.debug("Couchbase query:", auth.queryApi || "", statement, args);

  return {
    method: method,
    url: auth.queryApi || "",
    authentication: {
      type: AuthenticationType.BASIC,
      username: auth.username,
      password: auth.password,
    },
    queryParams: params,
  }
};
export const scopeId = (auth: PiecePropValueSchema<typeof couchbaseAuth>) => (
  "`" + auth.bucket + "`" + auth.scope + "`"
);

const preciseDistance = Property.Checkbox({
  displayName: 'Use precise distance',
  description: 'Use slower but more precise `VECTOR_DISTANCE` function over `APPROX_VECTOR_DISTANCE`',
  required: false,
});
const targetVector = Property.LongText({
  displayName: 'Target Vector',
  description:
    'Array of numbers representing the target vector (e.g., [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]).',
  required: true,
});
const vectorExpr = Property.ShortText({
  displayName: 'Vector Expression',
  description: 'The expression returning a vector (NOT Index Name). Must match the expression specified in the vector index with field names prefixed with "data.", for example: `data.vectorField`.',
  required: true,
});
const maxDistance = Property.Number({
  displayName: 'Maximum Distance',
  description: 'Maximum distance from the target vector.',
  required: true,
});
const orderDirection = Property.StaticDropdown({
  displayName: 'Order',
  required: true,
  options: {
      options: [
        {
          label: 'Descending',
          value: 'DESC',
        },
        {
          label: 'Ascending',
          value: 'ASC',
        },
      ],
  }
});
const vectorSimilarity = Property.StaticDropdown({
  displayName: 'Vector Similarity',
  description: 'The distance metric to use when comparing vectors during index creation.',
  required: true,
  defaultValue: 'L2_SQUARED',
  options:  {
    options: [
      {
        label: 'Cosine Similarity',
        value: 'COSINE',
      },
      {
        label: 'Dot Product',
        value: 'DOT',
      },
      {
        label: 'Euclidean Distance',
        value: 'L2',
      },
      {
        label: 'Squared Euclidean Distance',
        value: 'L2_SQUARED',
      },
    ],
  }
});

export interface LooseObject {
  [key: string]: any
}

export const checkForErrors = (response: HttpResponse<any>): void => {
  if (response.status > 299) {
    throw new Error("Query API error " + response.status + ": " + JSON.stringify(response.body as LooseObject));
  }
  if (response.body.errors) {
    throw new Error("Query Service errors : " + JSON.stringify(response.body.errors as LooseObject));
  }
}

export const couchbaseCommonProps = {
  collection: Property.ShortText({
    displayName: 'Collection Name',
    description: 'The name of the collection to use. Leave blank for default collection',
    required: false,
  }),
  identifier(required = true) {
    return Property.ShortText({
      displayName: 'Document Identifier',
      description: 'Id of the document in the collection.',
      required: required,
    })
  },
  query: Property.LongText({
    displayName: 'SQL++ Select Statement',
    description: 'Base SELECT statement with optional positional parameters that fetches required data.\nIt will be transformed to include other step parameters before sending it to Couchbase.\nNOTE: Should not include LIMIT or OFFSET clauses (please use the fields below).',
    required: true,
  }),
  arguments: Property.Array({
    displayName: 'Query arguments',
    description: 'An array of values to be passed as query positional parameters.',
    required: false,
  }),
  document: Property.Json({
    displayName: 'Document Value',
    description: 'The value for the document to be stored.',
    required: true,
  }),
  vectorField: Property.ShortText({
    displayName: 'Vector Field',
    description: 'The field containing vectors to be searched.',
    required: true,
  }),
  vectorExpr: vectorExpr,
  targetVector: targetVector,
  maxDistance: maxDistance,
  vectorK: Property.Number({
    displayName: 'Number of results',
    description: 'Enter the total number of results that you want to return from your Vector Search query (default: 1).',
    required: false,
  }),
  vectorFilters: Property.Array({
    displayName: "Vector Distance Filters",
    description: "Parameters for filtering results by similarity to provided vector.\nNOTE: requires a pre-existing vector index.",
    required: false,
    properties: {
      preciseDistance: preciseDistance,
      targetVector: targetVector,
      vectorExpr: vectorExpr,
      vectorSimilarity: vectorSimilarity,
      maxDistance: maxDistance,
    }
  }),
  vectorOrder: Property.Array({
    displayName: "Vector Distance Order",
    description: "Parameters for ordering results by similarity to provided vector.\nNOTE: requires a pre-existing vector index.",
    required: false,
    properties: {
      preciseDistance: preciseDistance,
      targetVector: targetVector,
      vectorExpr: vectorExpr,
      vectorSimilarity: vectorSimilarity,
    }
  }),
  orderDirection: orderDirection,
  limit: Property.Number({
    displayName: 'Query Limit',
    description: 'SQL++ LIMIT clause argument',
    required: false,
  }),
  offset: Property.Number({
    displayName: 'Query Offset',
    description: 'SQL++ OFFSET clause argument',
    required: false,
  }),
};
