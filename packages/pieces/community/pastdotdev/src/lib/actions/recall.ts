import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pastDevAuth } from '../auth';
import { pastDevClient } from '../common/client';
import { pastDevProps } from '../common/props';

export const recallAction = createAction({
  auth: pastDevAuth,
  name: 'recall',
  classification: 'SEARCH',
  displayName: 'Recall',
  description:
    'Find what past dev remembers about a question, for one identity. Returns ranked memories with their dated sources.',
  audience: 'both',
  aiMetadata: {
    description:
      'Recall ranked memory from past dev for a natural-language query, as seen by one identity. Use it before you answer a question about past conversations, preferences or facts; use Ingest to save new information. The workflow builder must set the identity, never the agent. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.LongText({
      displayName: 'Query',
      description:
        'The question in plain words, for example "What did the customer say about pricing?"',
      required: true,
    }),
    identity: pastDevProps.identityDropdown({
      required: true,
      description:
        'The person or account who asks. Recall returns only the memory this identity can read. Select one, type one, or map one from an earlier step. Set this value yourself: never let an AI agent choose it.',
    }),
    limit: Property.Number({
      displayName: 'Maximum results',
      description: 'The maximum number of memories to return, from 1 to 200. The default is 100.',
      required: false,
    }),
    level: Property.StaticDropdown({
      displayName: 'Evidence level',
      description:
        'How much evidence to return. Your plan can lower the level. Do not set it together with Maximum tokens.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Low (8,000 tokens)', value: 'low' },
          { label: 'Medium (16,000 tokens)', value: 'medium' },
          { label: 'High (24,000 tokens)', value: 'high' },
          { label: 'Extra high (32,000 tokens)', value: 'extra-high' },
        ],
      },
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum tokens',
      description:
        'An exact evidence budget in tokens, if no level fits. Do not set it together with Evidence level.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'Relevance puts the best match first. Chronological puts the oldest first.',
      required: false,
      defaultValue: 'relevance',
      options: {
        disabled: false,
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Chronological', value: 'chronological' },
        ],
      },
    }),
    queryTimestamp: Property.DateTime({
      displayName: 'As of',
      description:
        'Read memory as it was at this time. Leave it empty to read memory as it is now.',
      required: false,
    }),
    occurredFrom: Property.DateTime({
      displayName: 'Occurred from',
      description: 'Only return memory that happened at or after this time.',
      required: false,
    }),
    occurredTo: Property.DateTime({
      displayName: 'Occurred to',
      description: 'Only return memory that happened at or before this time.',
      required: false,
    }),
  },
  async run(context) {
    const { query, identity, limit, level, maxTokens, sort, queryTimestamp, occurredFrom, occurredTo } =
      context.propsValue;
    if (level && maxTokens !== undefined && maxTokens !== null) {
      throw new Error('Set Evidence level or Maximum tokens, not both.');
    }
    const response = await pastDevClient.sendRequest<RecallResponse>({
      connection: {
        apiKey: context.auth.props.apiKey,
        apiHost: context.auth.props.apiHost,
      },
      method: HttpMethod.POST,
      path: '/api/v1/recall',
      body: pastDevClient.withoutEmpty({
        query,
        identity,
        limit,
        level,
        maxTokens,
        sort,
        queryTimestamp,
        occurredFrom,
        occurredTo,
      }),
      redactBodyInErrors: true,
    });
    const results = response.body.results.map(flattenResult);
    return {
      asOf: response.body.asOf,
      usedEvidenceTokens: response.body.usedEvidenceTokens,
      resultCount: results.length,
      text: results
        .map((result) => `[${result.occurredAt}] ${result.content}`)
        .join('\n\n'),
      results,
      requestId: response.requestId,
    };
  },
});

function flattenResult(result: RecallResult) {
  return {
    rank: result.rank,
    id: result.id,
    content: result.content,
    occurredAt: result.occurredAt,
    kind: result.artifact.kind,
    supersededAt: result.artifact.supersededAt ?? null,
    sourceIds: result.sources.map((source) => source.sourceId).join(', '),
    sources: result.sources,
  };
}

type RecallSource = {
  sourceId: string;
  occurredAt: string;
  label?: string;
  metadata?: unknown;
  excerpts: string[];
};

type RecallResult = {
  id: string;
  rank: number;
  occurredAt: string;
  content: string;
  artifact: {
    id: string;
    kind: string;
    occurredAt: string;
    supersededAt?: string;
  };
  sources: RecallSource[];
};

type RecallResponse = {
  asOf: string;
  usedEvidenceTokens: number;
  results: RecallResult[];
};
