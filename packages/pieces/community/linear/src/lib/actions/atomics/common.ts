import { Property } from '@activepieces/pieces-framework';
import { LinearAuth, linearGraphql } from '../../common/graphql';
import { LinearProjectStatusUpdateNode } from '../../common/mappers';
import { PROJECT_STATUS_UPDATE_GET_QUERY } from './queries';

function flattenProject(project: LinearProjectNode) {
  const teams = project.teams?.nodes ?? [];
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    url: project.url,
    icon: project.icon ?? null,
    color: project.color ?? null,
    priority: project.priority,
    priority_label: project.priorityLabel,
    progress: project.progress,
    health: project.health ?? null,
    start_date: project.startDate ?? null,
    target_date: project.targetDate ?? null,
    status_id: project.status?.id ?? null,
    status_name: project.status?.name ?? null,
    status_type: project.status?.type ?? null,
    lead_id: project.lead?.id ?? null,
    lead_name: project.lead?.name ?? null,
    lead_email: project.lead?.email ?? null,
    creator_id: project.creator?.id ?? null,
    creator_name: project.creator?.name ?? null,
    team_ids: teams.map((team) => team.id),
    team_names: teams.map((team) => team.name).join(', '),
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    completed_at: project.completedAt ?? null,
    canceled_at: project.canceledAt ?? null,
    archived_at: project.archivedAt ?? null,
    trashed: project.trashed ?? false,
  };
}

function flattenProjectWithMilestones(project: LinearProjectNode) {
  return {
    ...flattenProject(project),
    milestones: (project.projectMilestones?.nodes ?? []).map((milestone) => ({
      id: milestone.id,
      name: milestone.name,
      target_date: milestone.targetDate ?? null,
      status: milestone.status,
    })),
  };
}

function flattenArchivedProject(entity: LinearArchivedProjectNode | null | undefined) {
  return {
    success: true,
    id: entity?.id ?? null,
    name: entity?.name ?? null,
    url: entity?.url ?? null,
    trashed: entity?.trashed ?? null,
    archived_at: entity?.archivedAt ?? null,
  };
}

function flattenComment(comment: LinearCommentNode) {
  return {
    id: comment.id,
    body: comment.body,
    url: comment.url,
    user_id: comment.user?.id ?? null,
    user_name: comment.user?.name ?? null,
    user_email: comment.user?.email ?? null,
    issue_id: comment.issue?.id ?? null,
    issue_identifier: comment.issue?.identifier ?? null,
    issue_title: comment.issue?.title ?? null,
    parent_id: comment.parent?.id ?? null,
    resolved_at: comment.resolvedAt ?? null,
    resolving_user_id: comment.resolvingUser?.id ?? null,
    resolving_user_name: comment.resolvingUser?.name ?? null,
    created_at: comment.createdAt,
    updated_at: comment.updatedAt,
    edited_at: comment.editedAt ?? null,
  };
}

function flattenTeam(team: LinearTeamNode) {
  return {
    id: team.id,
    key: team.key,
    name: team.name,
    description: team.description ?? null,
    icon: team.icon ?? null,
    color: team.color ?? null,
    timezone: team.timezone,
    cycles_enabled: team.cyclesEnabled,
    triage_enabled: team.triageEnabled,
    default_issue_estimate: team.defaultIssueEstimate,
    issue_estimation_type: team.issueEstimationType,
    created_at: team.createdAt,
    updated_at: team.updatedAt,
    archived_at: team.archivedAt ?? null,
  };
}

function flattenTeamDetails(team: LinearTeamNode) {
  return {
    ...flattenTeam(team),
    issue_count: team.issueCount ?? null,
    default_issue_state_id: team.defaultIssueState?.id ?? null,
    default_issue_state_name: team.defaultIssueState?.name ?? null,
    default_issue_state_type: team.defaultIssueState?.type ?? null,
  };
}

function flattenUser(user: LinearUserNode) {
  return {
    id: user.id,
    name: user.name,
    display_name: user.displayName,
    email: user.email,
    active: user.active,
    admin: user.admin,
    guest: user.guest,
    url: user.url,
    avatar_url: user.avatarUrl ?? null,
    timezone: user.timezone ?? null,
    created_at: user.createdAt,
  };
}

function flattenViewer(user: LinearUserNode) {
  return {
    ...flattenUser(user),
    organization_id: user.organization?.id ?? null,
    organization_name: user.organization?.name ?? null,
    organization_url_key: user.organization?.urlKey ?? null,
  };
}

function flattenCycle(cycle: LinearCycleNode) {
  return {
    id: cycle.id,
    number: cycle.number,
    name: cycle.name ?? null,
    starts_at: cycle.startsAt,
    ends_at: cycle.endsAt,
    completed_at: cycle.completedAt ?? null,
    progress: cycle.progress,
    is_active: cycle.isActive,
    is_next: cycle.isNext,
    is_previous: cycle.isPrevious,
    team_id: cycle.team?.id ?? null,
    team_key: cycle.team?.key ?? null,
    team_name: cycle.team?.name ?? null,
  };
}

function flattenLabel(label: LinearLabelNode) {
  return {
    id: label.id,
    name: label.name,
    color: label.color,
    description: label.description ?? null,
    is_group: label.isGroup,
    is_workspace_label: !label.team,
    team_id: label.team?.id ?? null,
    team_key: label.team?.key ?? null,
    team_name: label.team?.name ?? null,
    parent_id: label.parent?.id ?? null,
    parent_name: label.parent?.name ?? null,
    created_at: label.createdAt,
  };
}

function flattenWorkflowState(state: LinearWorkflowStateNode) {
  return {
    id: state.id,
    name: state.name,
    type: state.type,
    color: state.color,
    position: state.position,
    description: state.description ?? null,
    team_id: state.team?.id ?? null,
    team_key: state.team?.key ?? null,
    team_name: state.team?.name ?? null,
  };
}

function flattenMilestone(milestone: LinearMilestoneNode) {
  return {
    id: milestone.id,
    name: milestone.name,
    description: milestone.description ?? null,
    target_date: milestone.targetDate ?? null,
    sort_order: milestone.sortOrder,
    status: milestone.status,
    progress: milestone.progress,
    project_id: milestone.project?.id ?? null,
    project_name: milestone.project?.name ?? null,
    created_at: milestone.createdAt,
  };
}

function flattenRelation(relation: LinearRelationNode) {
  return {
    id: relation.id,
    type: relation.type,
    issue_id: relation.issue?.id ?? null,
    issue_identifier: relation.issue?.identifier ?? null,
    issue_title: relation.issue?.title ?? null,
    related_issue_id: relation.relatedIssue?.id ?? null,
    related_issue_identifier: relation.relatedIssue?.identifier ?? null,
    related_issue_title: relation.relatedIssue?.title ?? null,
    created_at: relation.createdAt,
  };
}

function flattenReaction(reaction: LinearReactionNode) {
  return {
    id: reaction.id,
    emoji: reaction.emoji,
    user_id: reaction.user?.id ?? null,
    user_name: reaction.user?.name ?? null,
    comment_id: reaction.comment?.id ?? null,
    created_at: reaction.createdAt,
  };
}

function limitProp({ fallback, max }: { fallback: number; max: number }) {
  return Property.Number({
    displayName: 'Limit',
    description: `How many records to return in this page, 1 to ${max}. Default ${fallback}.`,
    required: false,
    defaultValue: fallback,
  });
}

function cursorProp() {
  return Property.ShortText({
    displayName: 'Page Cursor',
    description: 'Pass end_cursor from the previous call to get the next page. Leave empty for the first page.',
    required: false,
  });
}

function triStateProp({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Turn on', value: 'true' },
        { label: 'Turn off', value: 'false' },
      ],
    },
  });
}

function healthProp({ description }: { description: string }) {
  return Property.StaticDropdown({
    displayName: 'Health',
    description,
    required: false,
    options: {
      options: [
        { label: 'On track', value: 'onTrack' },
        { label: 'At risk', value: 'atRisk' },
        { label: 'Off track', value: 'offTrack' },
      ],
    },
  });
}

function triStateValue(value: unknown): boolean | undefined {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

function priorityValue(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 4) {
    throw new Error('Priority must be a whole number from 0 to 4 (0 none, 1 urgent, 2 high, 3 medium, 4 low).');
  }
  return parsed;
}

async function setStatusUpdateArchived({
  auth,
  id,
  archived,
  mutation,
  field,
}: {
  auth: LinearAuth;
  id: string;
  archived: boolean;
  mutation: string;
  field: 'projectUpdateArchive' | 'projectUpdateUnarchive';
}): Promise<LinearProjectStatusUpdateNode> {
  try {
    const data = await linearGraphql.request<Record<string, { success: boolean; entity: LinearProjectStatusUpdateNode | null }>>({
      auth,
      query: mutation,
      variables: { id },
    });
    const payload = linearGraphql.requireSuccess({ payload: data[field], what: archived ? 'status update archive' : 'status update restore' });
    if (!payload.entity) {
      throw new Error('Linear did not return the status update.');
    }
    return payload.entity;
  } catch (error) {
    if (!linearGraphql.isNotFoundError(error)) {
      throw error;
    }
    const current = await linearGraphql
      .request<{ projectUpdate: LinearProjectStatusUpdateNode | null }>({ auth, query: PROJECT_STATUS_UPDATE_GET_QUERY, variables: { id } })
      .catch(() => ({ projectUpdate: null }));
    const isArchived = Boolean(current.projectUpdate?.archivedAt);
    if (!current.projectUpdate || isArchived !== archived) {
      throw error;
    }
    return current.projectUpdate;
  }
}

function idFilter(value: string | undefined) {
  return value ? { id: { eq: value } } : undefined;
}

export const atomicMappers = {
  flattenProject,
  flattenProjectWithMilestones,
  flattenArchivedProject,
  flattenComment,
  flattenTeam,
  flattenTeamDetails,
  flattenUser,
  flattenViewer,
  flattenCycle,
  flattenLabel,
  flattenWorkflowState,
  flattenMilestone,
  flattenRelation,
  flattenReaction,
};

export const atomicStatusUpdates = {
  setStatusUpdateArchived,
};

export const atomicProps = {
  limitProp,
  cursorProp,
  triStateProp,
  triStateValue,
  healthProp,
  idFilter,
  priorityValue,
};

export type LinearProjectNode = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  icon?: string | null;
  color?: string | null;
  priority: number;
  priorityLabel: string;
  progress: number;
  health?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  canceledAt?: string | null;
  archivedAt?: string | null;
  trashed?: boolean | null;
  status?: { id: string; name: string; type: string } | null;
  lead?: { id: string; name: string; email: string } | null;
  creator?: { id: string; name: string } | null;
  teams?: { nodes: Array<{ id: string; key: string; name: string }> } | null;
  projectMilestones?: {
    nodes: Array<{ id: string; name: string; targetDate?: string | null; status: string }>;
  } | null;
};

export type LinearArchivedProjectNode = {
  id: string;
  name: string;
  url: string;
  trashed?: boolean | null;
  archivedAt?: string | null;
};

export type LinearCommentNode = {
  id: string;
  body: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  resolvedAt?: string | null;
  user?: { id: string; name: string; email: string } | null;
  resolvingUser?: { id: string; name: string } | null;
  issue?: { id: string; identifier: string; title: string } | null;
  parent?: { id: string } | null;
};

export type LinearTeamNode = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  timezone: string;
  cyclesEnabled: boolean;
  triageEnabled: boolean;
  defaultIssueEstimate: number;
  issueEstimationType: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  issueCount?: number | null;
  defaultIssueState?: { id: string; name: string; type: string } | null;
};

export type LinearUserNode = {
  id: string;
  name: string;
  displayName: string;
  email: string;
  active: boolean;
  admin: boolean;
  guest: boolean;
  url: string;
  avatarUrl?: string | null;
  timezone?: string | null;
  createdAt: string;
  organization?: { id: string; name: string; urlKey: string } | null;
};

export type LinearCycleNode = {
  id: string;
  number: number;
  name?: string | null;
  startsAt: string;
  endsAt: string;
  completedAt?: string | null;
  progress: number;
  isActive: boolean;
  isNext: boolean;
  isPrevious: boolean;
  team?: { id: string; key: string; name: string } | null;
};

export type LinearLabelNode = {
  id: string;
  name: string;
  color: string;
  description?: string | null;
  isGroup: boolean;
  createdAt: string;
  team?: { id: string; key: string; name: string } | null;
  parent?: { id: string; name: string } | null;
};

export type LinearWorkflowStateNode = {
  id: string;
  name: string;
  type: string;
  color: string;
  position: number;
  description?: string | null;
  team?: { id: string; key: string; name: string } | null;
};

export type LinearMilestoneNode = {
  id: string;
  name: string;
  description?: string | null;
  targetDate?: string | null;
  sortOrder: number;
  status: string;
  progress: number;
  createdAt: string;
  project?: { id: string; name: string } | null;
};

export type LinearRelationNode = {
  id: string;
  type: string;
  createdAt: string;
  issue?: { id: string; identifier: string; title: string } | null;
  relatedIssue?: { id: string; identifier: string; title: string } | null;
};

export type LinearReactionNode = {
  id: string;
  emoji: string;
  createdAt: string;
  user?: { id: string; name: string } | null;
  comment?: { id: string } | null;
};
