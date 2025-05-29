import { ApMarkdown } from "@/components/custom/markdown";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { todosApi } from "@/features/todos/lib/todos-api";
import { MarkdownVariant, Todo, TodoActivityChanged, TodoChanged, WebsocketClientEvent } from "@activepieces/shared";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TodoLinks } from "./todo-links";
import { TodoDetailsStatus } from "./todo-details-status";
import { useState, useEffect } from "react";
import { TodoActivitiesSection } from "./todo-activities-section";
import { useSocket } from "@/components/socket-provider";
import { cn } from "@/lib/utils";

type TodoDetailsProps = {
  todoId: string;
  onClose?: () => void;
  onStatusChange?: (status: Todo['status']) => void;
  className?: string;
}

export const TodoDetails = ({ todoId, onClose, onStatusChange, className }: TodoDetailsProps) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const socket = useSocket();
  const { data: todo, isLoading, refetch } = useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => todosApi.get(todoId),
  });

  useEffect(() => {
    const handleTodoChanged = (event: TodoChanged) => {
      if (event.todoId === todoId) {
        refetch();
      }
    };

    socket.on(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);

    return () => {
      socket.off(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
    };
  }, [socket, refetch, todoId]);

  const handleStatusChange = async (status: Todo['status']) => {
    if (!todo) return;
    setIsUpdatingStatus(true);
    try {
      await todosApi.update(todo.id, { status });
      onStatusChange?.(status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen mode="fullscreen"></LoadingScreen>
  }

  return <div className={cn("flex flex-col w-full h-[100vh]", className)}>
    <ScrollArea className="flex-1 px-6">
      <div className="flex flex-col py-5 gap-2">
        <div className="flex items-center gap-2">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
          <div className="text-3xl font-bold flex items-center gap-4">
            <div className="max-w-[40ch] truncate">
              {todo?.title}
            </div>
            {todo && (
              <TodoDetailsStatus
                todo={todo}
                isUpdatingStatus={isUpdatingStatus}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>
        </div>


        <ApMarkdown
          className="mt-4 text-base"
          markdown={todo?.description ?? ''}
          variant={MarkdownVariant.BORDERLESS}
        />
        <TodoLinks
          flowId={todo?.flowId ?? undefined}
        />
        <div className="flex flex-col">
          <Separator className="my-4" />
          {todo && <TodoActivitiesSection todo={todo} />}
        </div>
      </div>
      <div className="mb-10"></div>
    </ScrollArea>
  </div>
};