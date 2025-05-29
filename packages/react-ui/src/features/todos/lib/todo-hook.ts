import { useQuery } from "@tanstack/react-query";
import { todosApi } from "./todos-api";


export const todosHooks = {
    useTodo: (todoId: string | null) => {
        return useQuery({
            queryKey: ['todo', todoId],
            queryFn: () => todosApi.get(todoId!),
            enabled: !!todoId,
        });
    }
}