import { OutputSchema } from '@activepieces/pieces-framework';
import { linearFieldSets } from '../../output-schemas';

const { issueFlatFields, attachmentFlatFields, projectStatusUpdateFlatFields, archivedIssueFields, pageFields } = linearFieldSets;

const projectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'icon', label: 'Icon' },
  { key: 'color', label: 'Color' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'priority_label', label: 'Priority Label' },
  { key: 'progress', label: 'Progress', format: 'number' },
  { key: 'health', label: 'Health' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'target_date', label: 'Target Date', format: 'date' },
  { key: 'status_id', label: 'Status ID' },
  { key: 'status_name', label: 'Status' },
  { key: 'status_type', label: 'Status Type' },
  { key: 'lead_id', label: 'Lead ID' },
  { key: 'lead_name', label: 'Lead Name' },
  { key: 'lead_email', label: 'Lead Email', format: 'email' },
  { key: 'creator_id', label: 'Creator ID' },
  { key: 'creator_name', label: 'Creator Name' },
  { key: 'team_ids', label: 'Team IDs' },
  { key: 'team_names', label: 'Teams' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'canceled_at', label: 'Canceled At', format: 'datetime' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
  { key: 'trashed', label: 'In Trash', format: 'boolean' },
];

const archivedProjectFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'trashed', label: 'In Trash', format: 'boolean' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'body', label: 'Body (Markdown)' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'user_id', label: 'Author ID' },
  { key: 'user_name', label: 'Author Name' },
  { key: 'user_email', label: 'Author Email', format: 'email' },
  { key: 'issue_id', label: 'Issue ID' },
  { key: 'issue_identifier', label: 'Issue Identifier' },
  { key: 'issue_title', label: 'Issue Title' },
  { key: 'parent_id', label: 'Parent Comment ID' },
  { key: 'resolved_at', label: 'Resolved At', format: 'datetime' },
  { key: 'resolving_user_id', label: 'Resolved By ID' },
  { key: 'resolving_user_name', label: 'Resolved By' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'edited_at', label: 'Edited At', format: 'datetime' },
];

const teamFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Team ID' },
  { key: 'key', label: 'Team Key' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'icon', label: 'Icon' },
  { key: 'color', label: 'Color' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'cycles_enabled', label: 'Cycles Enabled', format: 'boolean' },
  { key: 'triage_enabled', label: 'Triage Enabled', format: 'boolean' },
  { key: 'default_issue_estimate', label: 'Default Estimate', format: 'number' },
  { key: 'issue_estimation_type', label: 'Estimation Type' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'admin', label: 'Admin', format: 'boolean' },
  { key: 'guest', label: 'Guest', format: 'boolean' },
  { key: 'url', label: 'Profile URL', format: 'url' },
  { key: 'avatar_url', label: 'Avatar', format: 'image' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const cycleFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Cycle ID' },
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'starts_at', label: 'Starts At', format: 'datetime' },
  { key: 'ends_at', label: 'Ends At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'progress', label: 'Progress', format: 'number' },
  { key: 'is_active', label: 'Current Cycle', format: 'boolean' },
  { key: 'is_next', label: 'Next Cycle', format: 'boolean' },
  { key: 'is_previous', label: 'Previous Cycle', format: 'boolean' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'team_key', label: 'Team Key' },
  { key: 'team_name', label: 'Team Name' },
];

const labelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Label ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'description', label: 'Description' },
  { key: 'is_group', label: 'Label Group', format: 'boolean' },
  { key: 'is_workspace_label', label: 'Workspace Label', format: 'boolean' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'team_key', label: 'Team Key' },
  { key: 'team_name', label: 'Team Name' },
  { key: 'parent_id', label: 'Parent Label ID' },
  { key: 'parent_name', label: 'Parent Label' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const workflowStateFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Status ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type', description: 'triage, backlog, unstarted, started, completed or canceled' },
  { key: 'color', label: 'Color' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'description', label: 'Description' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'team_key', label: 'Team Key' },
  { key: 'team_name', label: 'Team Name' },
];

const milestoneFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Milestone ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'target_date', label: 'Target Date', format: 'date' },
  { key: 'sort_order', label: 'Sort Order', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'progress', label: 'Progress', format: 'number' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const atomicIssueOutputSchema: OutputSchema = { fields: issueFlatFields };
export const atomicIssuesPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Issues', items: issueFlatFields, labelKey: 'identifier' }),
};
export const atomicIssueSearchOutputSchema: OutputSchema = {
  fields: [
    ...pageFields({ itemsLabel: 'Issues', items: issueFlatFields, labelKey: 'identifier' }),
    { key: 'total_count', label: 'Total Matches', format: 'number' },
  ],
};
export const atomicArchivedIssueOutputSchema: OutputSchema = { fields: archivedIssueFields };
export const atomicIssueRelationOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Relation ID' },
    { key: 'type', label: 'Type' },
    { key: 'issue_id', label: 'Issue ID' },
    { key: 'issue_identifier', label: 'Issue Identifier' },
    { key: 'issue_title', label: 'Issue Title' },
    { key: 'related_issue_id', label: 'Related Issue ID' },
    { key: 'related_issue_identifier', label: 'Related Issue Identifier' },
    { key: 'related_issue_title', label: 'Related Issue Title' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const atomicLabelUpsertOutputSchema: OutputSchema = {
  fields: [{ key: 'created', label: 'Created Now', format: 'boolean' }, ...labelFields],
};
export const atomicLabelsPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Labels', items: labelFields, labelKey: 'name' }),
};
export const atomicWorkflowStatesPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Statuses', items: workflowStateFields, labelKey: 'name' }),
};

export const atomicTeamOutputSchema: OutputSchema = { fields: teamFields };
export const atomicTeamDetailsOutputSchema: OutputSchema = {
  fields: [
    ...teamFields,
    { key: 'issue_count', label: 'Issue Count', format: 'number' },
    { key: 'default_issue_state_id', label: 'Default Status ID' },
    { key: 'default_issue_state_name', label: 'Default Status' },
    { key: 'default_issue_state_type', label: 'Default Status Type' },
  ],
};
export const atomicTeamsPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Teams', items: teamFields, labelKey: 'name' }),
};

export const atomicUsersPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Users', items: userFields, labelKey: 'name' }),
};
export const atomicViewerOutputSchema: OutputSchema = {
  fields: [
    ...userFields,
    { key: 'organization_id', label: 'Workspace ID' },
    { key: 'organization_name', label: 'Workspace Name' },
    { key: 'organization_url_key', label: 'Workspace URL Key' },
  ],
};

export const atomicCyclesPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Cycles', items: cycleFields, labelKey: 'number' }),
};

export const atomicCommentOutputSchema: OutputSchema = { fields: commentFields };
export const atomicCommentsPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Comments', items: commentFields, labelKey: 'id' }),
};
export const atomicReactionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Reaction ID' },
    { key: 'emoji', label: 'Emoji' },
    { key: 'user_id', label: 'User ID' },
    { key: 'user_name', label: 'User Name' },
    { key: 'comment_id', label: 'Comment ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const atomicAttachmentOutputSchema: OutputSchema = { fields: attachmentFlatFields };
export const atomicUploadDownloadOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File' },
    { key: 'file_name', label: 'File Name' },
    { key: 'mime_type', label: 'MIME Type' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
  ],
};

export const atomicProjectOutputSchema: OutputSchema = { fields: projectFields };
export const atomicProjectDetailsOutputSchema: OutputSchema = {
  fields: [
    ...projectFields,
    {
      key: 'milestones',
      label: 'Milestones',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Milestone ID' },
        { key: 'name', label: 'Name' },
        { key: 'target_date', label: 'Target Date', format: 'date' },
        { key: 'status', label: 'Status' },
      ],
    },
  ],
};
export const atomicProjectsPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Projects', items: projectFields, labelKey: 'name' }),
};
export const atomicArchivedProjectOutputSchema: OutputSchema = { fields: archivedProjectFields };
export const atomicMilestoneOutputSchema: OutputSchema = { fields: milestoneFields };

export const atomicProjectStatusUpdateOutputSchema: OutputSchema = { fields: projectStatusUpdateFlatFields };
export const atomicProjectStatusUpdatesPageOutputSchema: OutputSchema = {
  fields: pageFields({ itemsLabel: 'Status Updates', items: projectStatusUpdateFlatFields, labelKey: 'created_at' }),
};
export const atomicArchivedProjectStatusUpdateOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }, ...projectStatusUpdateFlatFields],
};
