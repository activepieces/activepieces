import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, LinearRelationNode } from './common';
import { ISSUE_RELATION_CREATE_MUTATION } from './queries';
import { atomicIssueRelationOutputSchema } from './output-schemas';

export const linearIssueRelationCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_relation_create',
  classification: 'WRITE',
  displayName: 'Create Issue Relation (AI)',
  description: 'Link two issues as blocking, duplicate or related.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Links two Linear issues: "blocks" means the first issue blocks the related issue, "duplicate" marks the first issue as a duplicate of the related one, "related" is a plain link. Use to record dependencies or duplicates; to nest an issue under another use Update Issue with a parent instead. Not idempotent: each call creates a relation record.',
    idempotent: false,
  },
  props: {
    issue_id: Property.ShortText({ displayName: 'Issue', description: 'UUID or identifier of the first issue, for example ENG-12.', required: true }),
    related_issue_id: Property.ShortText({ displayName: 'Related Issue', description: 'UUID or identifier of the second issue, for example ENG-34.', required: true }),
    type: Property.StaticDropdown({
      displayName: 'Relation Type',
      required: true,
      options: {
        options: [
          { label: 'Issue blocks related issue', value: 'blocks' },
          { label: 'Issue is a duplicate of related issue', value: 'duplicate' },
          { label: 'Related', value: 'related' },
        ],
      },
    }),
  },
  outputSchema: atomicIssueRelationOutputSchema,
  async run({ auth, propsValue }) {
    if (!RELATION_TYPES.includes(propsValue.type)) {
      throw new Error('Relation Type must be one of blocks, duplicate or related.');
    }
    const issueId = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const relatedIssueId = await linearGraphql.resolveIssueId({ auth, value: propsValue.related_issue_id });
    if (issueId === relatedIssueId) {
      throw new Error('An issue cannot be related to itself.');
    }
    const data = await linearGraphql.request<{
      issueRelationCreate: { success: boolean; issueRelation: LinearRelationNode };
    }>({
      auth,
      query: ISSUE_RELATION_CREATE_MUTATION,
      variables: { input: { issueId, relatedIssueId, type: propsValue.type } },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.issueRelationCreate, what: 'issue relation' });
    return atomicMappers.flattenRelation(payload.issueRelation);
  },
});

const RELATION_TYPES = ['blocks', 'duplicate', 'related'];
