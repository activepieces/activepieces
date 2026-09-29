import {
  ATTACHMENT_SELECTION,
  ISSUE_SELECTION,
  PROJECT_STATUS_UPDATE_SELECTION,
} from '../../common/queries';

export const PROJECT_SELECTION = `
  id
  name
  description
  url
  icon
  color
  priority
  priorityLabel
  progress
  health
  startDate
  targetDate
  createdAt
  updatedAt
  completedAt
  canceledAt
  archivedAt
  trashed
  status { id name type }
  lead { id name email }
  creator { id name }
  teams(first: 50) { nodes { id key name } }
`;

export const COMMENT_SELECTION = `
  id
  body
  url
  createdAt
  updatedAt
  editedAt
  resolvedAt
  user { id name email }
  resolvingUser { id name }
  issue { id identifier title }
  parent { id }
`;

export const TEAM_SELECTION = `
  id
  key
  name
  description
  icon
  color
  timezone
  cyclesEnabled
  triageEnabled
  defaultIssueEstimate
  issueEstimationType
  createdAt
  updatedAt
  archivedAt
`;

export const USER_SELECTION = `
  id
  name
  displayName
  email
  active
  admin
  guest
  url
  avatarUrl
  timezone
  createdAt
`;

export const CYCLE_SELECTION = `
  id
  number
  name
  startsAt
  endsAt
  completedAt
  progress
  isActive
  isNext
  isPrevious
  team { id key name }
`;

export const LABEL_SELECTION = `
  id
  name
  color
  description
  isGroup
  createdAt
  team { id key name }
  parent { id name }
`;

export const WORKFLOW_STATE_SELECTION = `
  id
  name
  type
  color
  position
  description
  team { id key name }
`;

export const MILESTONE_SELECTION = `
  id
  name
  description
  targetDate
  sortOrder
  status
  progress
  createdAt
  project { id name }
`;

export const ISSUE_CREATE_MUTATION = `
  mutation LinearAtomicIssueCreate($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue { ${ISSUE_SELECTION} }
    }
  }
`;

export const ISSUE_UPDATE_MUTATION = `
  mutation LinearAtomicIssueUpdate($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue { ${ISSUE_SELECTION} }
    }
  }
`;

export const ISSUES_LIST_QUERY = `
  query LinearAtomicIssuesList($filter: IssueFilter, $first: Int, $after: String, $includeArchived: Boolean, $orderBy: PaginationOrderBy) {
    issues(filter: $filter, first: $first, after: $after, includeArchived: $includeArchived, orderBy: $orderBy) {
      pageInfo { hasNextPage endCursor }
      nodes { ${ISSUE_SELECTION} }
    }
  }
`;

export const ISSUE_ARCHIVE_MUTATION = `
  mutation LinearAtomicIssueArchive($id: String!) {
    issueArchive(id: $id) {
      success
      entity { id identifier title url trashed archivedAt }
    }
  }
`;

export const ISSUE_UNARCHIVE_MUTATION = `
  mutation LinearAtomicIssueUnarchive($id: String!) {
    issueUnarchive(id: $id) {
      success
      entity { id identifier title url trashed archivedAt }
    }
  }
`;

export const ISSUE_RELATION_CREATE_MUTATION = `
  mutation LinearAtomicIssueRelationCreate($input: IssueRelationCreateInput!) {
    issueRelationCreate(input: $input) {
      success
      issueRelation {
        id
        type
        createdAt
        issue { id identifier title }
        relatedIssue { id identifier title }
      }
    }
  }
`;

export const ISSUE_LABELS_LIST_QUERY = `
  query LinearAtomicIssueLabelsList($filter: IssueLabelFilter, $first: Int, $after: String) {
    issueLabels(filter: $filter, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { ${LABEL_SELECTION} }
    }
  }
`;

export const ISSUE_LABEL_CREATE_MUTATION = `
  mutation LinearAtomicIssueLabelCreate($input: IssueLabelCreateInput!) {
    issueLabelCreate(input: $input) {
      success
      issueLabel { ${LABEL_SELECTION} }
    }
  }
`;

export const WORKFLOW_STATES_LIST_QUERY = `
  query LinearAtomicWorkflowStatesList($filter: WorkflowStateFilter, $first: Int, $after: String) {
    workflowStates(filter: $filter, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { ${WORKFLOW_STATE_SELECTION} }
    }
  }
`;

export const TEAMS_LIST_QUERY = `
  query LinearAtomicTeamsList($first: Int, $after: String, $includeArchived: Boolean) {
    teams(first: $first, after: $after, includeArchived: $includeArchived) {
      pageInfo { hasNextPage endCursor }
      nodes { ${TEAM_SELECTION} }
    }
  }
`;

export const TEAM_GET_QUERY = `
  query LinearAtomicTeamGet($id: String!) {
    team(id: $id) {
      ${TEAM_SELECTION}
      issueCount
      defaultIssueState { id name type }
    }
  }
`;

export const TEAM_UPDATE_MUTATION = `
  mutation LinearAtomicTeamUpdate($id: String!, $input: TeamUpdateInput!) {
    teamUpdate(id: $id, input: $input) {
      success
      team { ${TEAM_SELECTION} }
    }
  }
`;

export const USERS_LIST_QUERY = `
  query LinearAtomicUsersList($filter: UserFilter, $first: Int, $after: String, $includeDisabled: Boolean) {
    users(filter: $filter, first: $first, after: $after, includeDisabled: $includeDisabled) {
      pageInfo { hasNextPage endCursor }
      nodes { ${USER_SELECTION} }
    }
  }
`;

export const VIEWER_GET_QUERY = `
  query LinearAtomicViewerGet {
    viewer {
      ${USER_SELECTION}
      organization { id name urlKey }
    }
  }
`;

export const CYCLES_LIST_QUERY = `
  query LinearAtomicCyclesList($filter: CycleFilter, $first: Int, $after: String) {
    cycles(filter: $filter, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { ${CYCLE_SELECTION} }
    }
  }
`;

export const COMMENT_CREATE_MUTATION = `
  mutation LinearAtomicCommentCreate($input: CommentCreateInput!) {
    commentCreate(input: $input) {
      success
      comment { ${COMMENT_SELECTION} }
    }
  }
`;

export const COMMENT_GET_QUERY = `
  query LinearAtomicCommentGet($id: String!) {
    comment(id: $id) { ${COMMENT_SELECTION} }
  }
`;

export const COMMENTS_LIST_QUERY = `
  query LinearAtomicCommentsList($filter: CommentFilter, $first: Int, $after: String) {
    comments(filter: $filter, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { ${COMMENT_SELECTION} }
    }
  }
`;

export const COMMENT_UPDATE_MUTATION = `
  mutation LinearAtomicCommentUpdate($id: String!, $input: CommentUpdateInput!) {
    commentUpdate(id: $id, input: $input) {
      success
      comment { ${COMMENT_SELECTION} }
    }
  }
`;

export const COMMENT_RESOLVE_MUTATION = `
  mutation LinearAtomicCommentResolve($id: String!, $resolvingCommentId: String) {
    commentResolve(id: $id, resolvingCommentId: $resolvingCommentId) {
      success
      comment { ${COMMENT_SELECTION} }
    }
  }
`;

export const COMMENT_UNRESOLVE_MUTATION = `
  mutation LinearAtomicCommentUnresolve($id: String!) {
    commentUnresolve(id: $id) {
      success
      comment { ${COMMENT_SELECTION} }
    }
  }
`;

export const REACTION_CREATE_MUTATION = `
  mutation LinearAtomicReactionCreate($input: ReactionCreateInput!) {
    reactionCreate(input: $input) {
      success
      reaction {
        id
        emoji
        createdAt
        user { id name }
        comment { id }
      }
    }
  }
`;

export const REACTION_DELETE_MUTATION = `
  mutation LinearAtomicReactionDelete($id: String!) {
    reactionDelete(id: $id) {
      success
      entityId
    }
  }
`;

export const ATTACHMENT_GET_QUERY = `
  query LinearAtomicAttachmentGet($id: String!) {
    attachment(id: $id) { ${ATTACHMENT_SELECTION} }
  }
`;

export const PROJECT_CREATE_MUTATION = `
  mutation LinearAtomicProjectCreate($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
      success
      project { ${PROJECT_SELECTION} }
    }
  }
`;

export const PROJECT_UPDATE_MUTATION = `
  mutation LinearAtomicProjectUpdate($id: String!, $input: ProjectUpdateInput!) {
    projectUpdate(id: $id, input: $input) {
      success
      project { ${PROJECT_SELECTION} }
    }
  }
`;

export const PROJECTS_LIST_QUERY = `
  query LinearAtomicProjectsList($filter: ProjectFilter, $first: Int, $after: String, $includeArchived: Boolean) {
    projects(filter: $filter, first: $first, after: $after, includeArchived: $includeArchived) {
      pageInfo { hasNextPage endCursor }
      nodes { ${PROJECT_SELECTION} }
    }
  }
`;

export const PROJECT_GET_QUERY = `
  query LinearAtomicProjectGet($id: String!) {
    project(id: $id) {
      ${PROJECT_SELECTION}
      projectMilestones(first: 50) { nodes { id name targetDate status } }
    }
  }
`;

export const PROJECT_DELETE_MUTATION = `
  mutation LinearAtomicProjectDelete($id: String!) {
    projectDelete(id: $id) {
      success
      entity { id name url trashed archivedAt }
    }
  }
`;

export const PROJECT_UNARCHIVE_MUTATION = `
  mutation LinearAtomicProjectUnarchive($id: String!) {
    projectUnarchive(id: $id) {
      success
      entity { id name url trashed archivedAt }
    }
  }
`;

export const PROJECT_MILESTONE_CREATE_MUTATION = `
  mutation LinearAtomicProjectMilestoneCreate($input: ProjectMilestoneCreateInput!) {
    projectMilestoneCreate(input: $input) {
      success
      projectMilestone { ${MILESTONE_SELECTION} }
    }
  }
`;

export const PROJECT_STATUS_UPDATE_GET_QUERY = `
  query LinearAtomicProjectStatusUpdateGet($id: String!) {
    projectUpdate(id: $id) { ${PROJECT_STATUS_UPDATE_SELECTION} }
  }
`;

export const PROJECT_STATUS_UPDATES_LIST_QUERY = `
  query LinearAtomicProjectStatusUpdatesList($filter: ProjectUpdateFilter, $first: Int, $after: String, $includeArchived: Boolean) {
    projectUpdates(filter: $filter, first: $first, after: $after, includeArchived: $includeArchived) {
      pageInfo { hasNextPage endCursor }
      nodes { ${PROJECT_STATUS_UPDATE_SELECTION} }
    }
  }
`;

export const PROJECT_STATUS_UPDATE_EDIT_MUTATION = `
  mutation LinearAtomicProjectStatusUpdateEdit($id: String!, $input: ProjectUpdateUpdateInput!) {
    projectUpdateUpdate(id: $id, input: $input) {
      success
      projectUpdate { ${PROJECT_STATUS_UPDATE_SELECTION} }
    }
  }
`;

export const PROJECT_STATUS_UPDATE_ARCHIVE_MUTATION = `
  mutation LinearAtomicProjectStatusUpdateArchive($id: String!) {
    projectUpdateArchive(id: $id) {
      success
      entity { ${PROJECT_STATUS_UPDATE_SELECTION} }
    }
  }
`;

export const PROJECT_STATUS_UPDATE_UNARCHIVE_MUTATION = `
  mutation LinearAtomicProjectStatusUpdateUnarchive($id: String!) {
    projectUpdateUnarchive(id: $id) {
      success
      entity { ${PROJECT_STATUS_UPDATE_SELECTION} }
    }
  }
`;
