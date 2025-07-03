import { createAction } from '@activepieces/pieces-framework';
import { sendTodoApproval, createTodoProps, constructTodoUrl } from '../utils/utils';
import { CreateTodoResult } from '@activepieces/shared';

export const createTodo = createAction({
  name: 'createTodo',
  displayName: 'Create Todo',
  description:
    'Creates a todo for a user, requiring them to respond or take action.',
  props: createTodoProps,
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  async test(context) {
    const response = await sendTodoApproval(context, true);
    const links = context.propsValue.statusOptions.map((option: any) => ({
      name: option.name,
      url: constructTodoUrl(context.server.publicUrl, response.body.id, option.name, true),
    }));
    return {
      id: response.body.id,
      links,
    };
  },
  async run(context) {
    const response = await sendTodoApproval(context, false);
    const links = context.propsValue.statusOptions.map((option: any) => ({
      name: option.name,
      url: constructTodoUrl(context.server.publicUrl, response.body.id, option.name, false),
    }));
    const result: CreateTodoResult = {
      id: response.body.id,
      links,
    }
    return result;
  },
});


