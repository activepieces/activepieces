import { createAction, Property } from '@activepieces/pieces-framework';
import { meistertaskAuth } from '../auth';

export const addComment = createAction({
  auth: meistertaskAuth,
  name: 'add_comment',
  displayName: 'Add Comment',
  description: 'Add a comment to a task',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Comment',
      required: true,
    }),
  },
  async run(context) {
    const response = await fetch(`https://www.meistertask.com/api/tasks/${context.propsValue.task_id}/comments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: context.propsValue.text }),
    });
    return await response.json();
  },
});
