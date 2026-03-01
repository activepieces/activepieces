export const enum ClickupEventType {
  TASK_CREATED = 'taskCreated',
  TASK_UPDATED = 'taskUpdated',
  TASK_DELETED = 'taskDeleted',
  TASK_PRIORITY_UPDATED = 'taskPriorityUpdated',
  TASK_STATUS_UPDATED = 'taskStatusUpdated',
  TASK_ASSIGNEE_UPDATED = 'taskAssigneeUpdated',
  TASK_DUEDATE_UPDATED = 'taskDueDateUpdated',
  TASK_TAG_UPDATED = 'taskTagUpdated',
  TASK_MOVED = 'taskMoved',
  TASK_COMMENT_POSTED = 'taskCommentPosted',
  TASK_COMMENT_UPDATED = 'taskCommentUpdated',
  TASK_TIME_ESTIMATE_UPDATED = 'taskTimeEstimateUpdated',
  TASK_TIME_TRACKED_UPDATED = 'taskTimeTrackedUpdated',
  LIST_CREATED = 'listCreated',
  LIST_UPDATED = 'listUpdated',
  LIST_DELETED = 'listDeleted',
  FOLDER_CREATED = 'folderCreated',
  FOLDER_UPDATED = 'folderUpdated',
  FOLDER_DELETED = 'folderDeleted',
  SPACE_CREATED = 'spaceCreated',
  SPACE_UPDATED = 'spaceUpdated',
  SPACE_DELETED = 'spaceDeleted',
  GOAL_CREATED = 'goalCreated',
  GOAL_UPDATED = 'goalUpdated',
  GOAL_DELETED = 'goalDeleted',
  KEY_RESULT_CREATED = 'keyResultCreated',
  KEY_RESULT_UPDATED = 'keyResultUpdated',
  KEY_RESULT_DELETED = 'keyResultDeleted',
  AUTOMATION_CREATED = 'automationCreated',
}

export interface ClickupTask {
  id: string;
  custom_id: string;
  name: string;
  text_content: string;
  description: string;
  status: {
    status: string;
    color: string;
    orderindex: number;
    type: string;
  };
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed: string;
  creator: {
    id: number;
    username: string;
    color: string;
    profilePicture: string;
  };
  assignees: string[];
  checklists: string[];
  tags: string[];
  parent: string;
  priority: string;
  due_date: string;
  start_date: string;
  time_estimate: string;
  time_spent: string;
  custom_fields: Record<string, unknown>[];
  list: {
    id: string;
  };
  folder: {
    id: string;
  };
  space: {
    id: string;
  };
  url: string;
}

export interface ClickupWebhookPayload {
  event: ClickupEventType;
  history_items: {
    id: string;
    type: number;
    date: string;
    field: string;
    parent_id: string;
    data: Record<string, unknown>;
    source: string;
    user: ClickupUser;
    before: string;
    after: string;
    comment: ClickupComment;
  };
  task_id: string;
  webhook_id: string;
}

interface ClickupUser {
  id: number;
  username: string;
  initials: string;
  email: string;
  color: string;
  profilePicture: string;
}

interface ClickupComment {
  id: string;
  comment: {
    text: string;
  }[];
  comment_text: string;
  user: ClickupUser;
  resolved: boolean;
  assignee: ClickupUser;
  assigned_by: ClickupUser;
  reactions: [];
  date: string;
}
export interface ClickupWorkspace {
  id: string;
  name: string;
  color: string;
  avatar: string;
  members: {
    user: ClickupUser;
    invited_by?: Record<string, unknown>;
  }[];
}
