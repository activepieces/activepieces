import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { PodioTask } from '../common/types';

export const createTaskAction = createAction({
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a new task in Podio.',
  auth: podioAuth,
  props: {
    text: Property.ShortText({
      displayName: 'Task Text',
      description: 'The title/text of the task',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Detailed description of the task',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due',
      required: false,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Private Task',
      description: 'Whether the task is private',
      required: false,
      defaultValue: false,
    }),
    responsibleUserId: Property.Number({
      displayName: 'Responsible User ID',
      description: 'ID of the user responsible for this task',
      required: false,
    }),
    refType: Property.StaticDropdown({
      displayName: 'Reference Type',
      description: 'Type of object this task references',
      required: false,
      options: {
        options: [
          { label: 'Item', value: 'item' },
          { label: 'App', value: 'app' },
          { label: 'Space', value: 'space' },
          { label: 'Organization', value: 'org' },
        ],
      },
    }),
    refId: Property.Number({
      displayName: 'Reference ID',
      description: 'ID of the referenced object',
      required: false,
    }),
  },
  async run(context) {
    const {
      text,
      description,
      dueDate,
      isPrivate,
      responsibleUserId,
      refType,
      refId,
    } = context.propsValue;

    if (!text) {
      throw new Error('Task text is required.');
    }

    const body: any = {
      text,
      private: isPrivate || false,
    };

    if (description) {
      body.description = description;
    }

    if (dueDate) {
      body.due_date = dueDate;
    }

    if (responsibleUserId) {
      body.responsible = responsibleUserId;
    }

    if (refType && refId) {
      body.ref_type = refType;
      body.ref_id = refId;
    }

    // https://developers.podio.com/doc/tasks/create-task-22419
    const response = await podioApiCall<PodioTask>({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/task/',
      body,
    });

    return response;
  },
});