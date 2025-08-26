import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicRefTypeProperty, dynamicRefIdProperty, dynamicAppProperty, dynamicSpaceProperty, dynamicOrgProperty, hookProperty, silentProperty } from '../common';

export const createTaskAction = createAction({
  auth: podioAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Add a new task to an item or workspace with due dates, assignees, and attachments.',
  props: {
    text: Property.LongText({
      displayName: 'Task Text',
      description: 'The description or text of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Additional description for the task',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      description: 'Whether the task should be private (only creator, assignee and assignor can see it)',
      required: false,
      defaultValue: false,
    }),
    
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Due date in local time (date only)',
      required: false,
    }),
    dueTime: Property.ShortText({
      displayName: 'Due Time', 
      description: 'Due time in local time (HH:MM:SS format, e.g., "14:30:00")',
      required: false,
    }),
    dueOn: Property.DateTime({
      displayName: 'Due Date & Time (UTC)',
      description: 'Complete due date and time in UTC. Alternative to separate date/time fields.',
      required: false,
    }),

    orgId: dynamicOrgProperty,
    spaceId: dynamicSpaceProperty,
    appId: dynamicAppProperty,
    
    refType: dynamicRefTypeProperty,
    refId: dynamicRefIdProperty,

    responsible: Property.Object({
      displayName: 'Responsible Person',
      description: 'Who is responsible for this task. Can be a user ID (number) or contact identifier object with type and id.',
      required: false,
    }),

    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'List of file IDs to attach to this task',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels (Text)',
      description: 'List of label names in text form',
      required: false,
    }),
    labelIds: Property.Array({
      displayName: 'Label IDs',
      description: 'List of label IDs (alternative to text labels)',
      required: false,
    }),

    reminder: Property.Object({
      displayName: 'Reminder',
      description: 'Reminder settings. Format: {"remind_delta": minutes_before_due_date}',
      required: false,
    }),
    recurrence: Property.Object({
      displayName: 'Recurrence',
      description: 'Recurring task settings. Format: {"name": "weekly|monthly|yearly", "config": {...}, "step": 1, "until": "date"}',
      required: false,
    }),

    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'External system identifier for this task',
      required: false,
    }),

    hook: hookProperty,
    silent: silentProperty,
  },
  async run(context) {
    console.log('🔍 [Podio Task] Action run started with propsValue:', JSON.stringify(context.propsValue, null, 2));
    
    const accessToken = getAccessToken(context.auth);
    const { 
      text, 
      description,
      private: isPrivate,
      dueDate,
      dueTime,
      dueOn,
      orgId,
      spaceId,
      appId,
      refType, 
      refId,
      responsible,
      fileIds,
      labels,
      labelIds,
      reminder,
      recurrence,
      externalId,
      hook,
      silent
    } = context.propsValue;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Task text is required and cannot be empty.');
    }

    if (refType && !refId) {
      throw new Error('Reference Object is required when Reference Type is specified. Please select an object from the dropdown.');
    }

    if (!refType && refId) {
      throw new Error('Reference Type is required when Reference Object is specified. Please select a reference type first.');
    }

    if (refType === 'item' && !appId) {
      throw new Error('App selection is required when referencing items. Please select an app first.');
    }

    if ((refType === 'status' || refType === 'task') && !spaceId) {
      throw new Error('Space selection is required when referencing status updates or tasks. Please select a space first.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (labels && !Array.isArray(labels)) {
      throw new Error('Labels must be provided as an array of strings.');
    }

    if (labelIds && !Array.isArray(labelIds)) {
      throw new Error('Label IDs must be provided as an array of numbers.');
    }

    if (reminder && typeof reminder !== 'object') {
      throw new Error('Reminder must be an object with remind_delta property.');
    }

    if (recurrence && typeof recurrence !== 'object') {
      throw new Error('Recurrence must be an object with name and config properties.');
    }

    const body: any = {
      text: text.trim(),
    };

    if (description && description.trim()) {
      body.description = description.trim();
    }

    if (typeof isPrivate === 'boolean') {
      body.private = isPrivate;
    }

    if (dueOn) {
      body.due_on = dueOn;
    } else if (dueDate || dueTime) {
      if (dueDate) {
        body.due_date = dueDate;
      }
      if (dueTime) {
        body.due_time = dueTime;
      }
    }

    if (refType && refId) {
      body.ref_type = refType;
      body.ref_id = refId;
    }

    if (responsible) {
      body.responsible = responsible;
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds.filter((id: unknown) => typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id))));
    }

    if (labels && Array.isArray(labels) && labels.length > 0) {
      body.labels = labels
        .filter((label: unknown): label is string => typeof label === 'string' && label.trim().length > 0)
        .map((label: string) => label.trim());
    } else if (labelIds && Array.isArray(labelIds) && labelIds.length > 0) {
      body.label_ids = labelIds.filter((id: unknown) => typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id))));
    }

    if (reminder && typeof reminder === 'object' && Object.keys(reminder).length > 0) {
      if (reminder['remind_delta'] && typeof reminder['remind_delta'] === 'number') {
        body.reminder = reminder;
      }
    }

    if (recurrence && typeof recurrence === 'object' && Object.keys(recurrence).length > 0) {
      if (recurrence['name'] && recurrence['config']) {
        body.recurrence = recurrence;
      }
    }

    if (externalId && externalId.trim()) {
      body.external_id = externalId.trim();
    }

    const queryParams: any = {};
    if (typeof hook === 'boolean') {
      queryParams.hook = hook.toString();
    }
    if (typeof silent === 'boolean') {
      queryParams.silent = silent.toString();
    }

    let resourceUri = '/task/';
    
    if (refType && refId) {
      resourceUri = `/task/${refType}/${refId}/`;
      
      delete body.ref_type;
      delete body.ref_id;
    } else {
      console.log('🔍 [Podio Task] Using general task endpoint:', resourceUri);
    }

    const response = await podioApiCall<{
      task_id: number;
      text: string;
      [key: string]: any;
    }>({
      method: HttpMethod.POST,
      accessToken,
      resourceUri,
      body,
      queryParams,
    });


    return response;
  },
}); 