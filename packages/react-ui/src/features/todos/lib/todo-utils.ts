import {
  isNil,
  PopulatedTodo,
  TodoActivityWithUser,
} from '@activepieces/shared';

export const todoUtils = {
  getAuthorName: (todo: PopulatedTodo | TodoActivityWithUser) => {
    const authorType = todoUtils.getAuthorType(todo);
    switch (authorType) {
      case 'user': {
        if ('createdByUser' in todo && todo.createdByUser) {
          return (
            todo.createdByUser?.firstName + ' ' + todo.createdByUser?.lastName
          );
        }
        if ('user' in todo && todo.user) {
          return todo.user?.firstName + ' ' + todo.user?.lastName;
        }
        return 'Unknown';
      }
      case 'agent':
        return todo.agent?.displayName ?? 'Unknown';
      case 'flow':
        if ('flow' in todo && todo.flow) {
          return todo.flow?.version.displayName ?? 'Flow';
        }
        return 'Unknown';
    }
  },
  getAuthorProfileUrl: (todo: PopulatedTodo | TodoActivityWithUser) => {
    const authorType = todoUtils.getAuthorType(todo);
    switch (authorType) {
      case 'agent':
        return todo.agent?.id ? `/agents/${todo.agent.id}` : undefined;
      default:
        return undefined;
    }
  },
  getAuthorPictureUrl: (todo: PopulatedTodo | TodoActivityWithUser) => {
    const authorType = todoUtils.getAuthorType(todo);
    switch (authorType) {
      case 'agent':
        return todo.agent?.profilePictureUrl;
      default:
        return undefined;
    }
  },
  getAuthorType: (
    todo: PopulatedTodo | TodoActivityWithUser,
  ): 'agent' | 'flow' | 'user' => {
    if ('createdByUser' in todo && !isNil(todo.createdByUser)) {
      return 'user';
    }
    if ('user' in todo && !isNil(todo.user)) {
      return 'user';
    }
    if ('agent' in todo && !isNil(todo.agent)) {
      return 'agent';
    }
    return 'flow';
  },
};
