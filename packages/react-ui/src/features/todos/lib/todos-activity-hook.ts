import { QueryClient, useQuery } from "@tanstack/react-query";
import { todoActivityApi } from "./todos-activitiy-api";


export const todosCommentsHook = {
    useComments: (todoId: string) => {
        return useQuery({
            queryKey: ['todos', todoId, 'comments'],
            queryFn: () => todoActivityApi.list(todoId, {
                cursor: undefined,
                limit: 100,
                todoId: todoId,
                type: undefined,
            }),
        });
    },
}

type UpdateCommentInCacheParams = {
    todoId: string
    activityId: string
    content: string
    queryClient: QueryClient
}