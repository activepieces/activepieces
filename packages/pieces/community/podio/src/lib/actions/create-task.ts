import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicRefTypeProperty, dynamicRefIdProperty, dynamicAppProperty, dynamicSpaceProperty } from '../common';

export const createTaskAction = createAction({
  auth: podioAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Podio',
  props: {
    text: Property.LongText({
      displayName: 'Task Text',
      description: 'The description or text of the task',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due (optional)',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Additional description for the task',
      required: false,
    }),
    responsible: Property.Number({
      displayName: 'Responsible User ID',
      description: 'The user id of the responsible user',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      description: 'Whether the task should be private',
      required: false,
      defaultValue: false,
    }),
    appId: dynamicAppProperty,
    spaceId: dynamicSpaceProperty,
    refType: dynamicRefTypeProperty,
    refId: dynamicRefIdProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { 
      text, 
      dueDate, 
      description, 
      responsible,
      private: isPrivate, 
      appId,
      spaceId,
      refType, 
      refId 
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

    if (responsible && typeof responsible !== 'number') {
      throw new Error('Responsible user ID must be a number.');
    }

    const body: any = {
      text: text.trim(),
    };

    if (dueDate) {
      body.due_date = dueDate;
    }

    if (description && description.trim()) {
      body.description = description.trim();
    }

    if (responsible) {
      body.responsible = responsible;
    }

    if (typeof isPrivate === 'boolean') {
      body.private = isPrivate;
    }

    if (refType) {
      body.ref_type = refType;
    }

    if (refId) {
      body.ref_id = refId;
    }

    const response = await podioApiCall<{
      task_id: number;
      text: string;
    }>({
      method: HttpMethod.POST,
      accessToken,
      resourceUri: '/task/',
      body,
    });

    return response;
  },
}); 