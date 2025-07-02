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
      case 'flow':
        if ('flow' in todo && todo.flow) {
          return todo.flow?.version.displayName ?? 'Flow';
        }
        return 'Unknown';
    }
  },
  getAuthorType: (
    todo: PopulatedTodo | TodoActivityWithUser,
  ): 'flow' | 'user' => {
    if ('createdByUser' in todo && !isNil(todo.createdByUser)) {
      return 'user';
    }
    if ('user' in todo && !isNil(todo.user)) {
      return 'user';
    }
    return 'flow';
  },
};
