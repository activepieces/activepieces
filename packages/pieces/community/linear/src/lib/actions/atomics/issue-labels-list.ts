import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection, linearMappers } from '../../common/mappers';
import { atomicMappers, atomicProps, LinearLabelNode } from './common';
import { ISSUE_LABELS_LIST_QUERY } from './queries';
import { atomicLabelsPageOutputSchema } from './output-schemas';

export const linearIssueLabelsListAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_labels_list',
  classification: 'SEARCH',
  displayName: 'List Issue Labels (AI)',
  description: 'List issue labels, optionally only one team (team labels plus workspace labels) or matching a name.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Linear issue labels with their IDs: every label, or with a team ID that team\'s labels plus the workspace labels every team can use, optionally narrowed by a name fragment. Use to resolve a label name to the ID that Create Issue, Update Issue and Add Label to Issue need. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'UUID of a team (from List Teams). Returns that team\'s labels and the workspace labels.', required: false }),
    name_contains: Property.ShortText({ displayName: 'Name Contains', description: 'Only labels whose name contains this text (case-insensitive).', required: false }),
    limit: atomicProps.limitProp({ fallback: 100, max: 250 }),
    cursor: atomicProps.cursorProp(),
  },
  outputSchema: atomicLabelsPageOutputSchema,
  async run({ auth, propsValue }) {
    const teamId = propsValue.team_id?.trim();
    const nameContains = propsValue.name_contains?.trim();
    const filter = linearGraphql.definedOnly({
      name: nameContains ? { containsIgnoreCase: nameContains } : undefined,
      or: teamId ? [{ team: { id: { eq: teamId } } }, { team: { null: true } }] : undefined,
    });
    const data = await linearGraphql.request<{ issueLabels: LinearConnection<LinearLabelNode> }>({
      auth,
      query: ISSUE_LABELS_LIST_QUERY,
      variables: {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        first: linearGraphql.clampLimit({ value: propsValue.limit, fallback: 100, max: 250 }),
        after: propsValue.cursor || undefined,
      },
    });
    return linearMappers.toPage({ connection: data.issueLabels, map: atomicMappers.flattenLabel });
  },
});
