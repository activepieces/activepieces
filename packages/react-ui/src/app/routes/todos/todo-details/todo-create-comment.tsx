import { todoActivityApi } from '@/features/todos/lib/todos-activitiy-api';
import { authenticationSession } from '@/lib/authentication-session';
import { Todo } from '@activepieces/shared';

import { TodoTextarea } from './todo-textarea';

type TodoCreateCommentProps = {
  todo: Todo;
  refetchComments: () => void;
};

export const TodoCreateComment = ({
  todo,
  refetchComments,
}: TodoCreateCommentProps) => {
  const handleSubmitComment = async (content: string) => {
    if (todo.locked) return;
    await todoActivityApi.create({
      projectId: authenticationSession.getProjectId()!,
      todoId: todo.id,
      content: content,
    });
    refetchComments();
  };

  return (
    <TodoTextarea
      onSubmit={handleSubmitComment}
      disabled={todo.locked}
      title="Add a Comment"
    />
  );
};
