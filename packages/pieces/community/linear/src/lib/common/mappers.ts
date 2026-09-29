function flattenIssue(issue: LinearIssueNode): FlatIssue {
  const labels = issue.labels?.nodes ?? [];
  return {
    id: issue.id,
    identifier: issue.identifier,
    number: issue.number,
    title: issue.title,
    description: issue.description ?? null,
    url: issue.url,
    priority: issue.priority,
    priority_label: issue.priorityLabel,
    estimate: issue.estimate ?? null,
    due_date: issue.dueDate ?? null,
    branch_name: issue.branchName,
    state_id: issue.state?.id ?? null,
    state_name: issue.state?.name ?? null,
    state_type: issue.state?.type ?? null,
    team_id: issue.team?.id ?? null,
    team_key: issue.team?.key ?? null,
    team_name: issue.team?.name ?? null,
    assignee_id: issue.assignee?.id ?? null,
    assignee_name: issue.assignee?.name ?? null,
    assignee_email: issue.assignee?.email ?? null,
    creator_id: issue.creator?.id ?? null,
    creator_name: issue.creator?.name ?? null,
    creator_email: issue.creator?.email ?? null,
    project_id: issue.project?.id ?? null,
    project_name: issue.project?.name ?? null,
    project_milestone_id: issue.projectMilestone?.id ?? null,
    project_milestone_name: issue.projectMilestone?.name ?? null,
    cycle_id: issue.cycle?.id ?? null,
    cycle_number: issue.cycle?.number ?? null,
    cycle_name: issue.cycle?.name ?? null,
    parent_id: issue.parent?.id ?? null,
    parent_identifier: issue.parent?.identifier ?? null,
    parent_title: issue.parent?.title ?? null,
    label_ids: labels.map((label) => label.id),
    label_names: labels.map((label) => label.name).join(', '),
    created_at: issue.createdAt,
    updated_at: issue.updatedAt,
    started_at: issue.startedAt ?? null,
    completed_at: issue.completedAt ?? null,
    canceled_at: issue.canceledAt ?? null,
    archived_at: issue.archivedAt ?? null,
    trashed: issue.trashed ?? false,
  };
}

function flattenAttachment(attachment: LinearAttachmentNode): FlatAttachment {
  return {
    id: attachment.id,
    title: attachment.title,
    subtitle: attachment.subtitle ?? null,
    url: attachment.url,
    source_type: attachment.sourceType ?? null,
    issue_id: attachment.issue?.id ?? null,
    issue_identifier: attachment.issue?.identifier ?? null,
    issue_title: attachment.issue?.title ?? null,
    creator_id: attachment.creator?.id ?? null,
    creator_name: attachment.creator?.name ?? null,
    created_at: attachment.createdAt,
    updated_at: attachment.updatedAt,
  };
}

function flattenProjectStatusUpdate(update: LinearProjectStatusUpdateNode): FlatProjectStatusUpdate {
  return {
    id: update.id,
    body: update.body,
    health: update.health ?? null,
    url: update.url,
    is_diff_hidden: update.isDiffHidden,
    user_id: update.user?.id ?? null,
    user_name: update.user?.name ?? null,
    user_email: update.user?.email ?? null,
    project_id: update.project?.id ?? null,
    project_name: update.project?.name ?? null,
    created_at: update.createdAt,
    updated_at: update.updatedAt,
    edited_at: update.editedAt ?? null,
    archived_at: update.archivedAt ?? null,
  };
}

function flattenArchivedIssue(entity: LinearArchivedIssueNode | null | undefined): FlatArchivedIssue {
  return {
    success: true,
    id: entity?.id ?? null,
    identifier: entity?.identifier ?? null,
    title: entity?.title ?? null,
    url: entity?.url ?? null,
    trashed: entity?.trashed ?? null,
    archived_at: entity?.archivedAt ?? null,
  };
}

function toPage<TNode, TFlat>({
  connection,
  map,
}: {
  connection: LinearConnection<TNode>;
  map: (node: TNode) => TFlat;
}): FlatPage<TFlat> {
  const items = connection.nodes.map(map);
  return {
    items,
    count: items.length,
    has_next_page: connection.pageInfo.hasNextPage,
    end_cursor: connection.pageInfo.endCursor ?? null,
  };
}

export const linearMappers = {
  flattenIssue,
  flattenAttachment,
  flattenProjectStatusUpdate,
  flattenArchivedIssue,
  toPage,
};

export type LinearConnection<TNode> = {
  nodes: TNode[];
  pageInfo: { hasNextPage: boolean; endCursor?: string | null };
};

export type LinearIssueNode = {
  id: string;
  identifier: string;
  number: number;
  title: string;
  description?: string | null;
  url: string;
  priority: number;
  priorityLabel: string;
  estimate?: number | null;
  dueDate?: string | null;
  branchName: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  canceledAt?: string | null;
  archivedAt?: string | null;
  trashed?: boolean | null;
  state?: { id: string; name: string; type: string } | null;
  team?: { id: string; key: string; name: string } | null;
  assignee?: { id: string; name: string; email: string } | null;
  creator?: { id: string; name: string; email: string } | null;
  project?: { id: string; name: string } | null;
  projectMilestone?: { id: string; name: string } | null;
  cycle?: { id: string; number: number; name?: string | null } | null;
  parent?: { id: string; identifier: string; title: string } | null;
  labels?: LinearIssueLabelConnection | null;
};

export type LinearIssueLabelConnection = {
  pageInfo?: { hasNextPage: boolean; endCursor?: string | null };
  nodes: Array<{ id: string; name: string }>;
};

export type LinearAttachmentNode = {
  id: string;
  title: string;
  subtitle?: string | null;
  url: string;
  sourceType?: string | null;
  createdAt: string;
  updatedAt: string;
  issue?: { id: string; identifier: string; title: string } | null;
  creator?: { id: string; name: string } | null;
};

export type LinearProjectStatusUpdateNode = {
  id: string;
  body: string;
  health?: string | null;
  url: string;
  isDiffHidden: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string | null;
  archivedAt?: string | null;
  user?: { id: string; name: string; email: string } | null;
  project?: { id: string; name: string } | null;
};

export type LinearArchivedIssueNode = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  trashed?: boolean | null;
  archivedAt?: string | null;
};

export type FlatIssue = {
  id: string;
  identifier: string;
  number: number;
  title: string;
  description: string | null;
  url: string;
  priority: number;
  priority_label: string;
  estimate: number | null;
  due_date: string | null;
  branch_name: string;
  state_id: string | null;
  state_name: string | null;
  state_type: string | null;
  team_id: string | null;
  team_key: string | null;
  team_name: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
  creator_id: string | null;
  creator_name: string | null;
  creator_email: string | null;
  project_id: string | null;
  project_name: string | null;
  project_milestone_id: string | null;
  project_milestone_name: string | null;
  cycle_id: string | null;
  cycle_number: number | null;
  cycle_name: string | null;
  parent_id: string | null;
  parent_identifier: string | null;
  parent_title: string | null;
  label_ids: string[];
  label_names: string;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  archived_at: string | null;
  trashed: boolean;
};

export type FlatAttachment = {
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
  source_type: string | null;
  issue_id: string | null;
  issue_identifier: string | null;
  issue_title: string | null;
  creator_id: string | null;
  creator_name: string | null;
  created_at: string;
  updated_at: string;
};

export type FlatProjectStatusUpdate = {
  id: string;
  body: string;
  health: string | null;
  url: string;
  is_diff_hidden: boolean;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  project_id: string | null;
  project_name: string | null;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  archived_at: string | null;
};

export type FlatArchivedIssue = {
  success: true;
  id: string | null;
  identifier: string | null;
  title: string | null;
  url: string | null;
  trashed: boolean | null;
  archived_at: string | null;
};

export type FlatPage<TFlat> = {
  items: TFlat[];
  count: number;
  has_next_page: boolean;
  end_cursor: string | null;
};
