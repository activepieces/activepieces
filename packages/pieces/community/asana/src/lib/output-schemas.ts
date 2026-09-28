import { OutputSchema } from '@activepieces/pieces-framework';

const namedRefFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'GID' },
  { key: 'name', label: 'Name' },
];

const userRefFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'User GID' },
  { key: 'name', label: 'Name' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'User GID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
];

const workspaceRefFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Workspace GID' },
  { key: 'name', label: 'Workspace Name' },
];

const projectRefFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Project GID' },
  { key: 'name', label: 'Project Name' },
];

const taskRefFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Task GID' },
  { key: 'name', label: 'Task Name' },
];

const taskListItemFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Task GID' },
  { key: 'name', label: 'Name' },
  { key: 'resource_subtype', label: 'Task Type' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'due_on', label: 'Due On', format: 'date' },
  { key: 'due_at', label: 'Due At', format: 'datetime' },
  { key: 'start_on', label: 'Start On', format: 'date' },
  { key: 'assignee', label: 'Assignee', children: userRefFields },
  { key: 'parent', label: 'Parent Task', children: taskRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'permalink_url', label: 'Task URL', format: 'url' },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Task GID' },
  { key: 'name', label: 'Name' },
  { key: 'resource_subtype', label: 'Task Type' },
  { key: 'notes', label: 'Notes' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'due_on', label: 'Due On', format: 'date' },
  { key: 'due_at', label: 'Due At', format: 'datetime' },
  { key: 'start_on', label: 'Start On', format: 'date' },
  { key: 'start_at', label: 'Start At', format: 'datetime' },
  { key: 'assignee', label: 'Assignee', children: userFields },
  { key: 'parent', label: 'Parent Task', children: taskRefFields },
  { key: 'projects', label: 'Projects', labelKey: 'name', listItems: projectRefFields },
  {
    key: 'memberships',
    label: 'Project Placements',
    listItems: [
      { key: 'project', label: 'Project', children: projectRefFields },
      {
        key: 'section',
        label: 'Section',
        children: [
          { key: 'gid', label: 'Section GID' },
          { key: 'name', label: 'Section Name' },
        ],
      },
    ],
  },
  { key: 'tags', label: 'Tags', labelKey: 'name', listItems: namedRefFields },
  { key: 'followers', label: 'Followers', labelKey: 'name', listItems: userRefFields },
  { key: 'workspace', label: 'Workspace', children: workspaceRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'permalink_url', label: 'Task URL', format: 'url' },
];

const projectListItemFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Project GID' },
  { key: 'name', label: 'Name' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'color', label: 'Color' },
  { key: 'privacy_setting', label: 'Privacy' },
  { key: 'start_on', label: 'Start On', format: 'date' },
  { key: 'due_on', label: 'Due On', format: 'date' },
  { key: 'owner', label: 'Owner', children: userRefFields },
  { key: 'team', label: 'Team', children: namedRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'permalink_url', label: 'Project URL', format: 'url' },
];

const projectFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Project GID' },
  { key: 'name', label: 'Name' },
  { key: 'notes', label: 'Notes' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'color', label: 'Color' },
  { key: 'default_view', label: 'Default View' },
  { key: 'privacy_setting', label: 'Privacy' },
  { key: 'start_on', label: 'Start On', format: 'date' },
  { key: 'due_on', label: 'Due On', format: 'date' },
  { key: 'owner', label: 'Owner', children: userRefFields },
  { key: 'team', label: 'Team', children: namedRefFields },
  { key: 'workspace', label: 'Workspace', children: workspaceRefFields },
  { key: 'members', label: 'Members', labelKey: 'name', listItems: userRefFields },
  { key: 'followers', label: 'Followers', labelKey: 'name', listItems: userRefFields },
  {
    key: 'current_status_update',
    label: 'Latest Status Update',
    children: [
      { key: 'gid', label: 'Status Update GID' },
      { key: 'title', label: 'Title' },
      { key: 'status_type', label: 'Status' },
    ],
  },
  { key: 'project_brief', label: 'Project Brief', children: [{ key: 'gid', label: 'Project Brief GID' }] },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'permalink_url', label: 'Project URL', format: 'url' },
];

const sectionFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Section GID' },
  { key: 'name', label: 'Name' },
  { key: 'project', label: 'Project', children: projectRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const storyListItemFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Story GID' },
  { key: 'type', label: 'Story Type' },
  { key: 'resource_subtype', label: 'Event' },
  { key: 'text', label: 'Text' },
  { key: 'is_pinned', label: 'Pinned', format: 'boolean' },
  { key: 'is_edited', label: 'Edited', format: 'boolean' },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const storyFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Story GID' },
  { key: 'type', label: 'Story Type' },
  { key: 'resource_subtype', label: 'Event' },
  { key: 'text', label: 'Text' },
  { key: 'html_text', label: 'Rich Text', format: 'html' },
  { key: 'is_pinned', label: 'Pinned', format: 'boolean' },
  { key: 'is_edited', label: 'Edited', format: 'boolean' },
  { key: 'is_editable', label: 'Editable', format: 'boolean' },
  { key: 'sticker_name', label: 'Sticker' },
  { key: 'target', label: 'Task', children: taskRefFields },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const tagListItemFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Tag GID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'permalink_url', label: 'Tag URL', format: 'url' },
];

const tagFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Tag GID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'notes', label: 'Notes' },
  { key: 'followers', label: 'Followers', labelKey: 'name', listItems: userRefFields },
  { key: 'workspace', label: 'Workspace', children: workspaceRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'permalink_url', label: 'Tag URL', format: 'url' },
];

const statusUpdateFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Status Update GID' },
  { key: 'title', label: 'Title' },
  { key: 'status_type', label: 'Status' },
  { key: 'text', label: 'Text' },
  { key: 'resource_subtype', label: 'Update Type' },
  { key: 'parent', label: 'Parent', children: namedRefFields },
  { key: 'author', label: 'Author', children: userRefFields },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
];

const projectBriefFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Project Brief GID' },
  { key: 'title', label: 'Title' },
  { key: 'text', label: 'Text' },
  { key: 'html_text', label: 'Rich Text', format: 'html' },
  { key: 'project', label: 'Project', children: projectRefFields },
  { key: 'permalink_url', label: 'Brief URL', format: 'url' },
];

const jobFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Job GID' },
  { key: 'resource_subtype', label: 'Job Type' },
  { key: 'status', label: 'Status' },
  { key: 'new_task', label: 'New Task', children: taskRefFields },
  { key: 'new_project', label: 'New Project', children: projectRefFields },
  {
    key: 'new_project_template',
    label: 'New Project Template',
    children: [
      { key: 'gid', label: 'Project Template GID' },
      { key: 'name', label: 'Project Template Name' },
    ],
  },
];

const membershipFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Membership GID' },
  { key: 'resource_subtype', label: 'Membership Type' },
  { key: 'access_level', label: 'Access Level' },
  {
    key: 'parent',
    label: 'Parent',
    children: [
      { key: 'gid', label: 'Parent GID' },
      { key: 'resource_type', label: 'Parent Type' },
      { key: 'name', label: 'Parent Name' },
    ],
  },
  {
    key: 'member',
    label: 'Member',
    children: [
      { key: 'gid', label: 'Member GID' },
      { key: 'resource_type', label: 'Member Type' },
      { key: 'name', label: 'Member Name' },
    ],
  },
];

const currentUserFields: OutputSchema['fields'] = [
  ...userFields,
  { key: 'workspaces', label: 'Workspaces', labelKey: 'name', listItems: workspaceRefFields },
];

const workspaceFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Workspace GID' },
  { key: 'name', label: 'Name' },
  { key: 'is_organization', label: 'Is Organization', format: 'boolean' },
  { key: 'email_domains', label: 'Email Domains' },
];

const teamListItemFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'Team GID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'organization', label: 'Organization', children: workspaceRefFields },
  { key: 'permalink_url', label: 'Team URL', format: 'url' },
];

const searchResultFields: OutputSchema['fields'] = [
  { key: 'gid', label: 'GID' },
  { key: 'name', label: 'Name' },
  { key: 'resource_type', label: 'Object Type' },
  { key: 'resource_subtype', label: 'Subtype' },
];

function listPage({
  key,
  label,
  labelKey,
  itemFields,
}: {
  key: string;
  label: string;
  labelKey: string;
  itemFields: OutputSchema['fields'];
}): OutputSchema {
  return {
    fields: [
      { key: 'data', label, labelKey, listItems: itemFields },
      {
        key: 'next_offset',
        label: 'Next Page Offset',
        description: `Pass as offset to fetch the next page of ${key}; empty when there are no more.`,
      },
    ],
  };
}

function confirmation({
  fields,
}: {
  fields: { key: string; label: string }[];
}): OutputSchema {
  return {
    fields: [{ key: 'success', label: 'Success', format: 'boolean' }, ...fields],
  };
}

export const asanaTaskOutputSchema: OutputSchema = { fields: taskFields };

export const asanaGetTaskOutputSchema: OutputSchema = {
  fields: [...taskFields, { key: 'num_subtasks', label: 'Subtask Count', format: 'number' }],
};

export const asanaCreateTaskOutputSchema: OutputSchema = {
  fields: [
    ...taskFields,
    { key: 'assignee_status', label: 'Assignee Status' },
    { key: 'num_likes', label: 'Likes', format: 'number' },
  ],
};

export const asanaTaskListOutputSchema = listPage({
  key: 'tasks',
  label: 'Tasks',
  labelKey: 'name',
  itemFields: taskListItemFields,
});

export const asanaProjectOutputSchema: OutputSchema = { fields: projectFields };

export const asanaProjectListOutputSchema = listPage({
  key: 'projects',
  label: 'Projects',
  labelKey: 'name',
  itemFields: projectListItemFields,
});

export const asanaProjectTaskCountsOutputSchema: OutputSchema = {
  fields: [
    { key: 'project_gid', label: 'Project GID' },
    { key: 'num_tasks', label: 'Tasks', format: 'number' },
    { key: 'num_completed_tasks', label: 'Completed Tasks', format: 'number' },
    { key: 'num_incomplete_tasks', label: 'Incomplete Tasks', format: 'number' },
    { key: 'num_milestones', label: 'Milestones', format: 'number' },
    { key: 'num_completed_milestones', label: 'Completed Milestones', format: 'number' },
    { key: 'num_incomplete_milestones', label: 'Incomplete Milestones', format: 'number' },
  ],
};

export const asanaSectionOutputSchema: OutputSchema = { fields: sectionFields };

export const asanaSectionListOutputSchema = listPage({
  key: 'sections',
  label: 'Sections',
  labelKey: 'name',
  itemFields: sectionFields,
});

export const asanaStoryOutputSchema: OutputSchema = { fields: storyFields };

export const asanaStoryListOutputSchema = listPage({
  key: 'stories',
  label: 'Stories',
  labelKey: 'text',
  itemFields: storyListItemFields,
});

export const asanaTagOutputSchema: OutputSchema = { fields: tagFields };

export const asanaTagListOutputSchema = listPage({
  key: 'tags',
  label: 'Tags',
  labelKey: 'name',
  itemFields: tagListItemFields,
});

export const asanaStatusUpdateOutputSchema: OutputSchema = { fields: statusUpdateFields };

export const asanaStatusUpdateListOutputSchema = listPage({
  key: 'status updates',
  label: 'Status Updates',
  labelKey: 'title',
  itemFields: statusUpdateFields,
});

export const asanaProjectBriefOutputSchema: OutputSchema = { fields: projectBriefFields };

export const asanaJobOutputSchema: OutputSchema = { fields: jobFields };

export const asanaMembershipOutputSchema: OutputSchema = { fields: membershipFields };

export const asanaMembershipListOutputSchema = listPage({
  key: 'memberships',
  label: 'Memberships',
  labelKey: 'access_level',
  itemFields: membershipFields,
});

export const asanaCurrentUserOutputSchema: OutputSchema = { fields: currentUserFields };

export const asanaWorkspaceListOutputSchema = listPage({
  key: 'workspaces',
  label: 'Workspaces',
  labelKey: 'name',
  itemFields: workspaceFields,
});

export const asanaTeamListOutputSchema = listPage({
  key: 'teams',
  label: 'Teams',
  labelKey: 'name',
  itemFields: teamListItemFields,
});

export const asanaSearchWorkspaceObjectsOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Results', labelKey: 'name', listItems: searchResultFields }],
};

export const asanaTaskTagChangeOutputSchema = confirmation({
  fields: [
    { key: 'task_gid', label: 'Task GID' },
    { key: 'tag_gid', label: 'Tag GID' },
  ],
});

export const asanaTaskProjectChangeOutputSchema = confirmation({
  fields: [
    { key: 'task_gid', label: 'Task GID' },
    { key: 'project_gid', label: 'Project GID' },
  ],
});

export const asanaMoveTaskToSectionOutputSchema = confirmation({
  fields: [
    { key: 'task_gid', label: 'Task GID' },
    { key: 'section_gid', label: 'Section GID' },
  ],
});

export const asanaMoveSectionOutputSchema = confirmation({
  fields: [
    { key: 'section_gid', label: 'Section GID' },
    { key: 'project_gid', label: 'Project GID' },
  ],
});

export const asanaDeleteTaskOutputSchema = confirmation({ fields: [{ key: 'task_gid', label: 'Deleted Task GID' }] });

export const asanaDeleteProjectOutputSchema = confirmation({
  fields: [{ key: 'project_gid', label: 'Deleted Project GID' }],
});

export const asanaDeleteSectionOutputSchema = confirmation({
  fields: [{ key: 'section_gid', label: 'Deleted Section GID' }],
});

export const asanaDeleteTagOutputSchema = confirmation({ fields: [{ key: 'tag_gid', label: 'Deleted Tag GID' }] });

export const asanaDeleteCommentOutputSchema = confirmation({
  fields: [{ key: 'story_gid', label: 'Deleted Comment GID' }],
});

export const asanaDeleteStatusUpdateOutputSchema = confirmation({
  fields: [{ key: 'status_update_gid', label: 'Deleted Status Update GID' }],
});

export const asanaDeleteProjectBriefOutputSchema = confirmation({
  fields: [{ key: 'project_brief_gid', label: 'Deleted Project Brief GID' }],
});

export const asanaDeleteMembershipOutputSchema = confirmation({
  fields: [{ key: 'membership_gid', label: 'Deleted Membership GID' }],
});
