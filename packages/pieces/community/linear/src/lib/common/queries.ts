export const ISSUE_SELECTION = `
  id
  identifier
  number
  title
  description
  url
  priority
  priorityLabel
  estimate
  dueDate
  branchName
  createdAt
  updatedAt
  startedAt
  completedAt
  canceledAt
  archivedAt
  trashed
  state { id name type }
  team { id key name }
  assignee { id name email }
  creator { id name email }
  project { id name }
  projectMilestone { id name }
  cycle { id number name }
  parent { id identifier title }
  labels(first: 50) {
    pageInfo { hasNextPage endCursor }
    nodes { id name }
  }
`;

export const ATTACHMENT_SELECTION = `
  id
  title
  subtitle
  url
  sourceType
  createdAt
  updatedAt
  issue { id identifier title }
  creator { id name }
`;

export const PROJECT_STATUS_UPDATE_SELECTION = `
  id
  body
  health
  url
  isDiffHidden
  createdAt
  updatedAt
  editedAt
  archivedAt
  user { id name email }
  project { id name }
`;

export const PARENT_TITLE_LOOKUP_QUERY = `
  query LinearParentTitleLookup($filter: IssueFilter!, $first: Int) {
    issues(filter: $filter, first: $first) {
      nodes { id identifier title }
    }
  }
`;

export const ISSUE_ID_LOOKUP_QUERY = `
  query LinearIssueIdLookup($id: String!) {
    issue(id: $id) { id }
  }
`;

export const ISSUE_LABELS_PAGE_QUERY = `
  query LinearIssueLabelsPage($id: String!, $after: String) {
    issue(id: $id) {
      labels(first: 250, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { id name }
      }
    }
  }
`;

export const GET_ISSUE_QUERY = `
  query LinearGetIssue($id: String!) {
    issue(id: $id) { ${ISSUE_SELECTION} }
  }
`;

export const SEARCH_ISSUES_QUERY = `
  query LinearSearchIssues($term: String!, $filter: IssueFilter, $first: Int, $after: String, $includeArchived: Boolean, $includeComments: Boolean) {
    searchIssues(term: $term, filter: $filter, first: $first, after: $after, includeArchived: $includeArchived, includeComments: $includeComments) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes { ${ISSUE_SELECTION} }
    }
  }
`;

export const ISSUE_ADD_LABEL_MUTATION = `
  mutation LinearIssueAddLabel($id: String!, $labelId: String!) {
    issueAddLabel(id: $id, labelId: $labelId) {
      success
      issue { ${ISSUE_SELECTION} }
    }
  }
`;

export const ISSUE_REMOVE_LABEL_MUTATION = `
  mutation LinearIssueRemoveLabel($id: String!, $labelId: String!) {
    issueRemoveLabel(id: $id, labelId: $labelId) {
      success
      issue { ${ISSUE_SELECTION} }
    }
  }
`;

export const ISSUE_DELETE_MUTATION = `
  mutation LinearIssueDelete($id: String!) {
    issueDelete(id: $id) {
      success
      entity { id identifier title url trashed archivedAt }
    }
  }
`;

export const ATTACHMENT_CREATE_MUTATION = `
  mutation LinearAttachmentCreate($input: AttachmentCreateInput!) {
    attachmentCreate(input: $input) {
      success
      attachment { ${ATTACHMENT_SELECTION} }
    }
  }
`;

export const PROJECT_STATUS_UPDATE_CREATE_MUTATION = `
  mutation LinearProjectStatusUpdateCreate($input: ProjectUpdateCreateInput!) {
    projectUpdateCreate(input: $input) {
      success
      projectUpdate { ${PROJECT_STATUS_UPDATE_SELECTION} }
    }
  }
`;

export const PROJECT_TEAM_IDS_QUERY = `
  query LinearProjectTeamIds($id: String!, $after: String) {
    project(id: $id) {
      id
      teams(first: 250, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { id }
      }
    }
  }
`;

export const TEAM_CYCLES_QUERY = `
  query LinearTeamCycles($filter: CycleFilter, $first: Int, $after: String) {
    cycles(filter: $filter, first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { id number name startsAt endsAt isActive isNext isPast }
    }
  }
`;

export const ALL_PROJECTS_QUERY = `
  query LinearAllProjects($first: Int, $after: String) {
    projects(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { id name }
    }
  }
`;
