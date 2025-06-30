import { todoActivityApi } from '@/features/todos/lib/todos-activitiy-api';
import { Todo } from '@activepieces/shared';

import { TodoTextarea } from './todo-textarea';

type TodoCreateCommentProps = {
  todo: Todo;
};

export const TodoCreateComment = ({ todo }: TodoCreateCommentProps) => {
  const handleSubmitComment = async (content: string) => {
    if (todo.locked) return;
    await todoActivityApi.create({
      todoId: todo.id,
      content: content,
    });
  };

  return (
    <TodoTextarea
      onSubmit={handleSubmitComment}
      disabled={todo.locked}
      title="Add a Comment"
    />
  );
};
