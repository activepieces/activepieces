import { OutputSchema } from '@activepieces/pieces-framework';

const actorFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'ID' },
];

const createdByActorField: OutputSchema['fields'][number] = {
  key: 'created_by_actor',
  label: 'Created By',
  children: actorFields,
};

const recordFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'object_id', label: 'Object ID' },
      { key: 'record_id', label: 'Record ID' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'web_url', label: 'Web URL', format: 'url' },
  { key: 'values', label: 'Values', dynamicKey: true },
];

const entryFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'list_id', label: 'List ID' },
      { key: 'entry_id', label: 'Entry ID' },
    ],
  },
  { key: 'parent_record_id', label: 'Parent Record ID' },
  { key: 'parent_object', label: 'Parent Object' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'entry_values', label: 'Entry Values', dynamicKey: true },
];

const attributeValueFields: OutputSchema['fields'] = [
  { key: 'active_from', label: 'Active From', format: 'datetime' },
  { key: 'active_until', label: 'Active Until', format: 'datetime' },
  createdByActorField,
  { key: 'value', label: 'Value' },
  { key: 'attribute_type', label: 'Attribute Type' },
];

const attributeFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'object_id', label: 'Object ID' },
      { key: 'attribute_id', label: 'Attribute ID' },
    ],
  },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'api_slug', label: 'API Slug' },
  { key: 'type', label: 'Type' },
  { key: 'is_system_attribute', label: 'System Attribute', format: 'boolean' },
  { key: 'is_writable', label: 'Writable', format: 'boolean' },
  { key: 'is_required', label: 'Required', format: 'boolean' },
  { key: 'is_unique', label: 'Unique', format: 'boolean' },
  { key: 'is_multiselect', label: 'Multiselect', format: 'boolean' },
  { key: 'is_default_value_enabled', label: 'Default Value Enabled', format: 'boolean' },
  { key: 'is_archived', label: 'Archived', format: 'boolean' },
  { key: 'default_value', label: 'Default Value' },
  {
    key: 'relationship',
    label: 'Relationship',
    children: [
      {
        key: 'id',
        label: 'ID',
        children: [
          { key: 'workspace_id', label: 'Workspace ID' },
          { key: 'object_id', label: 'Object ID' },
          { key: 'attribute_id', label: 'Attribute ID' },
        ],
      },
      { key: 'object_slug', label: 'Object Slug' },
      { key: 'api_slug', label: 'API Slug' },
      { key: 'is_multiselect', label: 'Multiselect', format: 'boolean' },
      { key: 'title', label: 'Title' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const selectOptionFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'object_id', label: 'Object ID' },
      { key: 'attribute_id', label: 'Attribute ID' },
      { key: 'option_id', label: 'Option ID' },
    ],
  },
  { key: 'title', label: 'Title' },
  { key: 'is_archived', label: 'Archived', format: 'boolean' },
];

const statusFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'object_id', label: 'Object ID' },
      { key: 'attribute_id', label: 'Attribute ID' },
      { key: 'status_id', label: 'Status ID' },
    ],
  },
  { key: 'title', label: 'Title' },
  { key: 'is_archived', label: 'Archived', format: 'boolean' },
  { key: 'target_time_in_status', label: 'Target Time In Status', format: 'duration' },
  { key: 'celebration_enabled', label: 'Celebration Enabled', format: 'boolean' },
];

const objectFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'object_id', label: 'Object ID' },
    ],
  },
  { key: 'api_slug', label: 'API Slug' },
  { key: 'singular_noun', label: 'Singular Noun' },
  { key: 'plural_noun', label: 'Plural Noun' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const listFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'list_id', label: 'List ID' },
    ],
  },
  { key: 'api_slug', label: 'API Slug' },
  { key: 'name', label: 'Name' },
  { key: 'parent_object', label: 'Parent Object' },
  { key: 'workspace_access', label: 'Workspace Access' },
  { key: 'workspace_member_access', label: 'Workspace Member Access' },
  createdByActorField,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const noteFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'note_id', label: 'Note ID' },
    ],
  },
  { key: 'parent_object', label: 'Parent Object' },
  { key: 'parent_record_id', label: 'Parent Record ID' },
  { key: 'title', label: 'Title' },
  { key: 'meeting_id', label: 'Meeting ID' },
  { key: 'content_plaintext', label: 'Content (Plain Text)' },
  { key: 'content_markdown', label: 'Content (Markdown)' },
  { key: 'tags', label: 'Tags' },
  createdByActorField,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const taskFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'task_id', label: 'Task ID' },
    ],
  },
  { key: 'content_plaintext', label: 'Content' },
  { key: 'is_completed', label: 'Completed', format: 'boolean' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'deadline_at', label: 'Deadline', format: 'datetime' },
  {
    key: 'linked_records',
    label: 'Linked Records',
    listItems: [
      { key: 'target_object_id', label: 'Object ID' },
      { key: 'target_record_id', label: 'Record ID' },
    ],
  },
  {
    key: 'assignees',
    label: 'Assignees',
    listItems: [
      { key: 'referenced_actor_type', label: 'Actor Type' },
      { key: 'referenced_actor_id', label: 'Actor ID' },
    ],
  },
  createdByActorField,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const commentFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'comment_id', label: 'Comment ID' },
    ],
  },
  { key: 'thread_id', label: 'Thread ID' },
  { key: 'content_plaintext', label: 'Content' },
  { key: 'author', label: 'Author', children: actorFields },
  {
    key: 'record',
    label: 'Record',
    children: [
      { key: 'record_id', label: 'Record ID' },
      { key: 'object_id', label: 'Object ID' },
    ],
  },
  { key: 'entry', label: 'Entry' },
  { key: 'resolved_at', label: 'Resolved At', format: 'datetime' },
  { key: 'resolved_by', label: 'Resolved By' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const threadIdField: OutputSchema['fields'][number] = {
  key: 'id',
  label: 'ID',
  children: [
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'thread_id', label: 'Thread ID' },
  ],
};

const meetingTimeFields: OutputSchema['fields'] = [
  { key: 'datetime', label: 'Date Time', format: 'datetime' },
  { key: 'timezone', label: 'Timezone' },
];

const meetingFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'meeting_id', label: 'Meeting ID' },
    ],
  },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'is_all_day', label: 'All Day', format: 'boolean' },
  { key: 'start', label: 'Start', children: meetingTimeFields },
  { key: 'end', label: 'End', children: meetingTimeFields },
  {
    key: 'participants',
    label: 'Participants',
    labelKey: 'email_address',
    listItems: [
      { key: 'email_address', label: 'Email', format: 'email' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'is_organizer', label: 'Organizer', format: 'boolean' },
    ],
  },
  {
    key: 'linked_records',
    label: 'Linked Records',
    listItems: [
      { key: 'object_slug', label: 'Object Slug' },
      { key: 'object_id', label: 'Object ID' },
      { key: 'record_id', label: 'Record ID' },
    ],
  },
  createdByActorField,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const callRecordingIdField: OutputSchema['fields'][number] = {
  key: 'id',
  label: 'ID',
  children: [
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'meeting_id', label: 'Meeting ID' },
    { key: 'call_recording_id', label: 'Call Recording ID' },
  ],
};

const callRecordingFields: OutputSchema['fields'] = [
  callRecordingIdField,
  { key: 'status', label: 'Status' },
  { key: 'web_url', label: 'Web URL', format: 'url' },
  createdByActorField,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const transcriptSegmentFields: OutputSchema['fields'] = [
  { key: 'speech', label: 'Speech' },
  { key: 'start_time', label: 'Start Time (s)', format: 'number' },
  { key: 'end_time', label: 'End Time (s)', format: 'number' },
  { key: 'speaker', label: 'Speaker', children: [{ key: 'name', label: 'Name' }] },
];

const fileFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'file_id', label: 'File ID' },
    ],
  },
  { key: 'name', label: 'Name' },
  { key: 'file_type', label: 'File Type' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'content_size', label: 'Size', format: 'filesize' },
  { key: 'parent_folder_id', label: 'Parent Folder ID' },
  { key: 'object_id', label: 'Object ID' },
  { key: 'object_slug', label: 'Object Slug' },
  { key: 'record_id', label: 'Record ID' },
  { key: 'storage_provider', label: 'Storage Provider' },
  createdByActorField,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const workspaceMemberFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'ID',
    children: [
      { key: 'workspace_id', label: 'Workspace ID' },
      { key: 'workspace_member_id', label: 'Workspace Member ID' },
    ],
  },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email_address', label: 'Email', format: 'email' },
  { key: 'avatar_url', label: 'Avatar', format: 'image' },
  { key: 'access_level', label: 'Access Level' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const countField: OutputSchema['fields'][number] = { key: 'count', label: 'Count', format: 'number' };
const nextCursorField: OutputSchema['fields'][number] = { key: 'next_cursor', label: 'Next Cursor' };

function deleteSchema({ idKey, idLabel }: { idKey: string; idLabel: string }): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: idKey, label: idLabel },
    ],
  };
}

export const attioCreateRecordOutputSchema: OutputSchema = { fields: recordFields };

export const createRecordOutputSchema: OutputSchema = { fields: recordFields };

export const findRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Records', listItems: recordFields },
  ],
};

export const attioQueryRecordsOutputSchema: OutputSchema = {
  fields: [{ key: 'records', label: 'Records', listItems: recordFields }, countField],
};

export const attioSearchRecordsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'record_text',
      listItems: [
        {
          key: 'id',
          label: 'ID',
          children: [
            { key: 'workspace_id', label: 'Workspace ID' },
            { key: 'object_id', label: 'Object ID' },
            { key: 'record_id', label: 'Record ID' },
          ],
        },
        { key: 'object_slug', label: 'Object Slug' },
        { key: 'record_text', label: 'Record Text' },
        { key: 'record_image', label: 'Record Image', format: 'image' },
        { key: 'domains', label: 'Domains' },
      ],
    },
    countField,
  ],
};

export const attioMergeRecordsOutputSchema: OutputSchema = {
  fields: [{ key: 'new_record_id', label: 'Merged Record ID' }],
};

export const attioListRecordAttributeValuesOutputSchema: OutputSchema = {
  fields: [{ key: 'values', label: 'Values', listItems: attributeValueFields }, countField],
};

export const attioListListEntryAttributeValuesOutputSchema: OutputSchema = {
  fields: [{ key: 'values', label: 'Values', listItems: attributeValueFields }, countField],
};

export const attioListRecordEntriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Entries',
      labelKey: 'list_api_slug',
      listItems: [
        { key: 'entry_id', label: 'Entry ID' },
        { key: 'list_id', label: 'List ID' },
        { key: 'list_api_slug', label: 'List API Slug' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    countField,
  ],
};

export const createEntryOutputSchema: OutputSchema = { fields: entryFields };

export const attioQueryListEntriesOutputSchema: OutputSchema = {
  fields: [{ key: 'entries', label: 'Entries', listItems: entryFields }, countField],
};

export const findListEntryOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Entries',
      listItems: [
        {
          key: 'id',
          label: 'ID',
          children: [
            { key: 'workspace_id', label: 'Workspace ID' },
            { key: 'list_id', label: 'List ID' },
            { key: 'entry_id', label: 'Entry ID' },
          ],
        },
        { key: 'parent_record_id', label: 'Parent Record ID' },
        { key: 'parent_object', label: 'Parent Object' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'values', label: 'Values', dynamicKey: true },
      ],
    },
  ],
};

export const attioGetAttributeOutputSchema: OutputSchema = { fields: attributeFields };

export const attioListAttributesOutputSchema: OutputSchema = {
  fields: [{ key: 'attributes', label: 'Attributes', labelKey: 'title', listItems: attributeFields }, countField],
};

export const attioCreateSelectOptionOutputSchema: OutputSchema = { fields: selectOptionFields };

export const attioListSelectOptionsOutputSchema: OutputSchema = {
  fields: [{ key: 'options', label: 'Options', labelKey: 'title', listItems: selectOptionFields }, countField],
};

export const attioCreateStatusOutputSchema: OutputSchema = { fields: statusFields };

export const attioListStatusesOutputSchema: OutputSchema = {
  fields: [{ key: 'statuses', label: 'Statuses', labelKey: 'title', listItems: statusFields }, countField],
};

export const attioCreateObjectOutputSchema: OutputSchema = { fields: objectFields };

export const attioListObjectsOutputSchema: OutputSchema = {
  fields: [{ key: 'objects', label: 'Objects', labelKey: 'plural_noun', listItems: objectFields }, countField],
};

export const attioListObjectViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'title',
      listItems: [
        {
          key: 'id',
          label: 'ID',
          children: [
            { key: 'workspace_id', label: 'Workspace ID' },
            { key: 'object_id', label: 'Object ID' },
            { key: 'view_id', label: 'View ID' },
          ],
        },
        { key: 'title', label: 'Title' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    countField,
    nextCursorField,
  ],
};

export const attioCreateListOutputSchema: OutputSchema = { fields: listFields };

export const attioListListsOutputSchema: OutputSchema = {
  fields: [{ key: 'lists', label: 'Lists', labelKey: 'name', listItems: listFields }, countField],
};

export const attioListListViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'title',
      listItems: [
        {
          key: 'id',
          label: 'ID',
          children: [
            { key: 'workspace_id', label: 'Workspace ID' },
            { key: 'list_id', label: 'List ID' },
            { key: 'view_id', label: 'View ID' },
          ],
        },
        { key: 'title', label: 'Title' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    countField,
    nextCursorField,
  ],
};

export const attioCreateNoteOutputSchema: OutputSchema = { fields: noteFields };

export const attioListNotesOutputSchema: OutputSchema = {
  fields: [{ key: 'notes', label: 'Notes', labelKey: 'title', listItems: noteFields }, countField],
};

export const attioCreateTaskOutputSchema: OutputSchema = { fields: taskFields };

export const attioUpdateTaskOutputSchema: OutputSchema = { fields: taskFields };

export const createTaskOutputSchema: OutputSchema = { fields: taskFields };

export const updateTaskOutputSchema: OutputSchema = { fields: taskFields };

export const attioListTasksOutputSchema: OutputSchema = {
  fields: [{ key: 'tasks', label: 'Tasks', labelKey: 'content_plaintext', listItems: taskFields }, countField],
};

export const listTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Tasks', labelKey: 'content_plaintext', listItems: taskFields },
  ],
};

export const deleteTaskOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const attioCreateCommentOutputSchema: OutputSchema = { fields: commentFields };

export const attioGetThreadOutputSchema: OutputSchema = {
  fields: [
    threadIdField,
    { key: 'comments', label: 'Comments', labelKey: 'content_plaintext', listItems: commentFields },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    nextCursorField,
  ],
};

export const attioListThreadsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'threads',
      label: 'Threads',
      listItems: [
        threadIdField,
        { key: 'comments', label: 'Comments', labelKey: 'content_plaintext', listItems: commentFields },
        { key: 'has_more_comments', label: 'Has More Comments', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    countField,
  ],
};

export const attioCreateMeetingOutputSchema: OutputSchema = { fields: meetingFields };

export const attioListMeetingsOutputSchema: OutputSchema = {
  fields: [{ key: 'meetings', label: 'Meetings', labelKey: 'title', listItems: meetingFields }, countField, nextCursorField],
};

export const attioCreateCallRecordingOutputSchema: OutputSchema = { fields: callRecordingFields };

export const attioListCallRecordingsOutputSchema: OutputSchema = {
  fields: [{ key: 'call_recordings', label: 'Call Recordings', listItems: callRecordingFields }, countField, nextCursorField],
};

export const attioGetCallRecordingOutputSchema: OutputSchema = {
  fields: [
    ...callRecordingFields,
    { key: 'video_url', label: 'Video URL', format: 'url' },
    {
      key: 'transcript',
      label: 'Transcript',
      children: [
        { key: 'segments', label: 'Segments', labelKey: 'speech', listItems: transcriptSegmentFields },
        { key: 'raw_transcript', label: 'Raw Transcript' },
      ],
    },
  ],
};

export const getCallTranscriptOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Transcript',
      children: [
        callRecordingIdField,
        { key: 'transcript', label: 'Segments', labelKey: 'speech', listItems: transcriptSegmentFields },
        { key: 'raw_transcript', label: 'Raw Transcript' },
        { key: 'web_url', label: 'Web URL', format: 'url' },
      ],
    },
    { key: 'pagination', label: 'Pagination', children: [nextCursorField] },
  ],
};

export const callRecordingCreatedOutputSchema: OutputSchema = {
  fields: [
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'meeting_id', label: 'Meeting ID' },
    { key: 'call_recording_id', label: 'Call Recording ID' },
  ],
};

export const attioCreateFolderOutputSchema: OutputSchema = {
  fields: fileFields.filter((field) => field.key !== 'content_type' && field.key !== 'content_size'),
};

export const attioGetFileOutputSchema: OutputSchema = { fields: fileFields };

export const attioListFilesOutputSchema: OutputSchema = {
  fields: [{ key: 'files', label: 'Files', labelKey: 'name', listItems: fileFields }, countField, nextCursorField],
};

export const attioDownloadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'name', label: 'Name' },
    { key: 'content_type', label: 'Content Type' },
    { key: 'content_size', label: 'Size', format: 'filesize' },
  ],
};

export const attioGetWorkspaceMemberOutputSchema: OutputSchema = { fields: workspaceMemberFields };

export const attioListWorkspaceMembersOutputSchema: OutputSchema = {
  fields: [{ key: 'members', label: 'Members', labelKey: 'email_address', listItems: workspaceMemberFields }, countField],
};

export const attioGetSelfOutputSchema: OutputSchema = {
  fields: [
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'workspace_id', label: 'Workspace ID' },
    { key: 'workspace_name', label: 'Workspace Name' },
    { key: 'workspace_slug', label: 'Workspace Slug' },
    { key: 'workspace_logo_url', label: 'Workspace Logo', format: 'image' },
    { key: 'authorized_by_workspace_member_id', label: 'Authorized By Member ID' },
    { key: 'token_level', label: 'Token Level' },
    { key: 'scope', label: 'Scopes' },
  ],
};

export const attioUnsubscribeEmailsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'unsubscribed',
      label: 'Unsubscribed',
      labelKey: 'email_address',
      listItems: [
        { key: 'email_address', label: 'Email', format: 'email' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
    countField,
  ],
};

export const attioDeleteRecordOutputSchema = deleteSchema({ idKey: 'record_id', idLabel: 'Record ID' });
export const attioDeleteListEntryOutputSchema = deleteSchema({ idKey: 'entry_id', idLabel: 'Entry ID' });
export const attioDeleteObjectOutputSchema = deleteSchema({ idKey: 'object', idLabel: 'Object' });
export const attioDeleteNoteOutputSchema = deleteSchema({ idKey: 'note_id', idLabel: 'Note ID' });
export const attioDeleteTaskOutputSchema = deleteSchema({ idKey: 'task_id', idLabel: 'Task ID' });
export const attioDeleteCommentOutputSchema = deleteSchema({ idKey: 'comment_id', idLabel: 'Comment ID' });
export const attioDeleteMeetingOutputSchema = deleteSchema({ idKey: 'meeting_id', idLabel: 'Meeting ID' });
export const attioDeleteCallRecordingOutputSchema = deleteSchema({ idKey: 'call_recording_id', idLabel: 'Call Recording ID' });
export const attioDeleteFileOutputSchema = deleteSchema({ idKey: 'file_id', idLabel: 'File ID' });
