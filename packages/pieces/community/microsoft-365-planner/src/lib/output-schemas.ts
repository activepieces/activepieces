import { OutputSchema } from '@activepieces/pieces-framework';

const etagField: OutputSchema['fields'][number] = {
  key: 'etag',
  label: 'ETag',
  value: "['@odata.etag']",
};

const identityFields: OutputSchema['fields'] = [
  {
    key: 'user',
    label: 'User',
    children: [
      { key: 'id', label: 'User ID' },
      { key: 'displayName', label: 'Display Name' },
    ],
  },
  {
    key: 'application',
    label: 'Application',
    children: [
      { key: 'id', label: 'Application ID' },
      { key: 'displayName', label: 'Display Name' },
    ],
  },
];

const userIdentityFields = identityFields.slice(0, 1);

const planFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Plan ID' },
  { key: 'title', label: 'Title' },
  { key: 'owner', label: 'Owner Group ID' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By', children: identityFields },
  {
    key: 'container',
    label: 'Container',
    children: [
      { key: 'containerId', label: 'Container ID' },
      { key: 'type', label: 'Container Type' },
      { key: 'url', label: 'Container URL', format: 'url' },
    ],
  },
  etagField,
];

const bucketFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Bucket ID' },
  { key: 'name', label: 'Name' },
  { key: 'planId', label: 'Plan ID' },
  { key: 'orderHint', label: 'Order Hint' },
  etagField,
];

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'title', label: 'Title' },
  { key: 'planId', label: 'Plan ID' },
  { key: 'bucketId', label: 'Bucket ID' },
  { key: 'percentComplete', label: 'Percent Complete', format: 'number' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'startDateTime', label: 'Start Date', format: 'datetime' },
  { key: 'dueDateTime', label: 'Due Date', format: 'datetime' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'completedDateTime', label: 'Completed At', format: 'datetime' },
  { key: 'hasDescription', label: 'Has Description', format: 'boolean' },
  { key: 'previewType', label: 'Preview Type' },
  { key: 'referenceCount', label: 'Link Count', format: 'number' },
  {
    key: 'checklistItemCount',
    label: 'Checklist Item Count',
    format: 'number',
  },
  {
    key: 'activeChecklistItemCount',
    label: 'Open Checklist Item Count',
    format: 'number',
  },
  { key: 'conversationThreadId', label: 'Conversation Thread ID' },
  { key: 'orderHint', label: 'Order Hint' },
  { key: 'assigneePriority', label: 'Assignee Priority' },
  { key: 'createdBy', label: 'Created By', children: identityFields },
  { key: 'completedBy', label: 'Completed By', children: identityFields },
  {
    key: 'assignments',
    label: 'Assignments (by User ID)',
    dynamicKey: true,
    children: [
      { key: 'assignedDateTime', label: 'Assigned At', format: 'datetime' },
      { key: 'orderHint', label: 'Order Hint' },
      { key: 'assignedBy', label: 'Assigned By', children: identityFields },
    ],
  },
  {
    key: 'appliedCategories',
    label: 'Applied Label Categories',
    dynamicKey: true,
    format: 'boolean',
  },
  etagField,
];

const taskDetailsFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'description', label: 'Description' },
  { key: 'previewType', label: 'Preview Type' },
  {
    key: 'checklist',
    label: 'Checklist (by Item ID)',
    dynamicKey: true,
    labelKey: 'title',
    children: [
      { key: 'title', label: 'Title' },
      { key: 'isChecked', label: 'Is Checked', format: 'boolean' },
      { key: 'orderHint', label: 'Order Hint' },
      {
        key: 'lastModifiedDateTime',
        label: 'Last Modified At',
        format: 'datetime',
      },
      {
        key: 'lastModifiedBy',
        label: 'Last Modified By',
        children: userIdentityFields,
      },
    ],
  },
  {
    key: 'references',
    label: 'Links (by Encoded URL)',
    dynamicKey: true,
    labelKey: 'alias',
    children: [
      { key: 'alias', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'previewPriority', label: 'Preview Priority' },
      {
        key: 'lastModifiedDateTime',
        label: 'Last Modified At',
        format: 'datetime',
      },
      {
        key: 'lastModifiedBy',
        label: 'Last Modified By',
        children: userIdentityFields,
      },
    ],
  },
  etagField,
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'mail', label: 'Email', format: 'email' },
  { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
];

export const microsoft365PlannerPlanOutputSchema: OutputSchema = {
  fields: planFields,
};

export const microsoft365PlannerPlanListOutputSchema: OutputSchema = {
  fields: [
    { key: 'plans', label: 'Plans', labelKey: 'title', listItems: planFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoft365PlannerFindPlanOutputSchema: OutputSchema = {
  itemLabel: '{title}',
  fields: [{ key: 'plans', label: 'Plans', value: '', listItems: planFields }],
};

export const microsoft365PlannerPlanDetailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Plan ID' },
    {
      key: 'sharedWith',
      label: 'Shared With (by User or Group ID)',
      dynamicKey: true,
      format: 'boolean',
    },
    {
      key: 'categoryDescriptions',
      label: 'Label Category Names',
      children: Array.from({ length: 25 }, (_, index) => ({
        key: `category${index + 1}`,
        label: `Category ${index + 1}`,
      })),
    },
    etagField,
  ],
};

export const microsoft365PlannerBucketOutputSchema: OutputSchema = {
  fields: bucketFields,
};

export const microsoft365PlannerBucketListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'buckets',
      label: 'Buckets',
      labelKey: 'name',
      listItems: bucketFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoft365PlannerTaskOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const microsoft365PlannerCreatedTaskOutputSchema: OutputSchema = {
  fields: taskFields.filter((field) => field.key !== 'appliedCategories'),
};

export const microsoft365PlannerTaskListOutputSchema: OutputSchema = {
  fields: [
    { key: 'tasks', label: 'Tasks', labelKey: 'title', listItems: taskFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const microsoft365PlannerFindTaskOutputSchema: OutputSchema = {
  itemLabel: '{title}',
  fields: [{ key: 'tasks', label: 'Tasks', value: '', listItems: taskFields }],
};

export const microsoft365PlannerTaskDetailsOutputSchema: OutputSchema = {
  fields: taskDetailsFields,
};

export const microsoft365PlannerDeletedOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Deleted ID' },
  ],
};

export const microsoft365PlannerSuccessOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const microsoft365PlannerCurrentUserOutputSchema: OutputSchema = {
  fields: [
    ...userFields,
    { key: 'jobTitle', label: 'Job Title' },
    { key: 'givenName', label: 'First Name' },
    { key: 'surname', label: 'Last Name' },
    { key: 'businessPhones', label: 'Business Phones' },
    { key: 'mobilePhone', label: 'Mobile Phone' },
    { key: 'officeLocation', label: 'Office Location' },
    { key: 'preferredLanguage', label: 'Preferred Language' },
  ],
};

export const microsoft365PlannerGroupListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'displayName',
      listItems: [
        { key: 'id', label: 'Group ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'description', label: 'Description' },
        { key: 'mail', label: 'Email', format: 'email' },
        { key: 'visibility', label: 'Visibility' },
        { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextCursor', label: 'Next Cursor' },
  ],
};

export const microsoft365PlannerMemberListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'users',
      label: 'Members',
      labelKey: 'displayName',
      listItems: userFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextCursor', label: 'Next Cursor' },
  ],
};
