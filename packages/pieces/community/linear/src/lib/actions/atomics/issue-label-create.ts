import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearConnection } from '../../common/mappers';
import { atomicMappers, LinearLabelNode } from './common';
import { ISSUE_LABEL_CREATE_MUTATION, ISSUE_LABELS_LIST_QUERY } from './queries';
import { atomicLabelUpsertOutputSchema } from './output-schemas';

export const linearIssueLabelCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_issue_label_create',
  classification: 'WRITE',
  displayName: 'Create Issue Label (AI)',
  description: 'Get a label by name, or create it if it does not exist yet (team or workspace label).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the issue label with this name (case-insensitive) that the given team can use (its own label first, else a workspace label), or the workspace label when no team is given, and creates it only if none exists yet; created tells which happened. Use before labelling issues by name. Idempotent: repeat calls return the same label, though two calls at the same moment can still race.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Label name, for example "Bug".', required: true }),
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'UUID of the team for a team label (from List Teams). Leave empty for a workspace label shared by all teams.', required: false }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color used when the label is created, for example #EB5757.', required: false }),
    description: Property.ShortText({ displayName: 'Description', description: 'Used only when the label is created.', required: false }),
  },
  outputSchema: atomicLabelUpsertOutputSchema,
  async run({ auth, propsValue }) {
    const name = propsValue.name.trim();
    if (name.length === 0) {
      throw new Error('Name is required.');
    }
    const color = propsValue.color?.trim();
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new Error('Color must be a hex color like #EB5757.');
    }
    const teamId = propsValue.team_id?.trim() || undefined;
    const existing = await linearGraphql.request<{ issueLabels: LinearConnection<LinearLabelNode> }>({
      auth,
      query: ISSUE_LABELS_LIST_QUERY,
      variables: {
        first: 10,
        filter: {
          name: { eqIgnoreCase: name },
          ...(teamId ? { or: [{ team: { id: { eq: teamId } } }, { team: { null: true } }] } : { team: { null: true } }),
        },
      },
    });
    const nodes = existing.issueLabels.nodes;
    const match = nodes.find((label) => teamId !== undefined && label.team?.id === teamId) ?? nodes[0];
    if (match) {
      return { created: false, ...atomicMappers.flattenLabel(match) };
    }
    const data = await linearGraphql.request<{
      issueLabelCreate: { success: boolean; issueLabel: LinearLabelNode };
    }>({
      auth,
      query: ISSUE_LABEL_CREATE_MUTATION,
      variables: {
        input: linearGraphql.definedOnly({ name, teamId, color, description: propsValue.description }),
      },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.issueLabelCreate, what: 'label creation' });
    return { created: true, ...atomicMappers.flattenLabel(payload.issueLabel) };
  },
});
