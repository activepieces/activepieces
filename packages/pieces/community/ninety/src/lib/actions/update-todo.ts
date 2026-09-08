import {
  createAction,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyPropUtils, ninetyProps } from '../common/props';
import { todoOutputSchema } from '../common/output-schemas';

export const updateTodo = createAction({
  auth: ninetyAuth,
  name: 'update_todo',
  classification: 'WRITE',
  displayName: 'Update To-Do',
  description: 'Change a to-do, or mark it complete or archived',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates one Ninety to-do by id. Only the fields you set are sent, so the rest are left as they are. This is how a to-do gets completed or archived. Safe to retry, since it sets the to-do to the state you give.',
    idempotent: true,
  },
  outputSchema: todoOutputSchema,
  props: {
    todoId: Property.ShortText({
      displayName: 'To-Do ID',
      description: 'The id of the to-do to update',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Ninety stores a to-do due date as a day, so the time is dropped',
      required: false,
    }),
    teamId: ninetyProps.teamIdMove,
    userId: ninetyProps.ownerIdKeep,
    completed: ninetyProps.completedSetter,
    archived: ninetyProps.archivedSetter,
    repeat: Property.ShortText({
      displayName: 'Repeat',
      description: 'A Ninety recurrence pattern such as weekly or monthly',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const todo = await ninetyCommon.updateTodo({
      token: auth.secret_text,
      todoId: propsValue.todoId,
      todo: {
        ...spreadIfDefined('title', propsValue.title),
        ...spreadIfDefined('description', propsValue.description),
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('userId', propsValue.userId),
        ...spreadIfDefined('repeat', propsValue.repeat),
        ...spreadIfDefined(
          'completed',
          ninetyPropUtils.triStateToBoolean(propsValue.completed)
        ),
        ...spreadIfDefined(
          'archived',
          ninetyPropUtils.triStateToBoolean(propsValue.archived)
        ),
        ...spreadIfDefined(
          'dueDate',
          ninetyCommon.toOptionalDateOnly({
            value: propsValue.dueDate,
            field: 'Due Date',
          })
        ),
      },
    });
    return todo;
  },
});
