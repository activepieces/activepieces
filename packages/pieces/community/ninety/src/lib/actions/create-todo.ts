import {
  createAction,
  Property,
  spreadIfDefined,
} from '@activepieces/pieces-framework';
import { ninetyAuth } from '../auth';
import { ninetyCommon } from '../common/client';
import { ninetyProps } from '../common/props';
import { todoOutputSchema } from '../common/output-schemas';

export const createTodo = createAction({
  auth: ninetyAuth,
  name: 'create_todo',
  classification: 'WRITE',
  displayName: 'Create To-Do',
  description: 'Add a to-do to a Ninety team or to your personal list',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates one Ninety to-do. Leaving the team empty makes it a personal to-do rather than a team one. Use Update To-Do to complete or edit an existing to-do. Each call creates a new to-do, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: todoOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'What needs doing',
      required: true,
    }),
    teamId: ninetyProps.teamIdForTodo,
    userId: ninetyProps.ownerId,
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      description: 'Ninety stores a to-do due date as a day, so the time is dropped',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    repeat: Property.ShortText({
      displayName: 'Repeat',
      description:
        'A Ninety recurrence pattern such as weekly or monthly. Leave empty for a one-off to-do.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const todo = await ninetyCommon.createTodo({
      token: auth.secret_text,
      todo: {
        title: propsValue.title,
        ...spreadIfDefined('teamId', propsValue.teamId),
        ...spreadIfDefined('userId', propsValue.userId),
        ...spreadIfDefined('description', propsValue.description),
        ...spreadIfDefined('repeat', propsValue.repeat),
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
