import { isNil, TodoChanged, WebsocketClientEvent, TodoActivityWithUser, TodoActivityChanged, PopulatedTodo, PopulatedFlow } from "@activepieces/shared";
import { todoActivitiesHook } from "@/features/todos/lib/todos-activity-hook";
import { useSocket } from "@/components/socket-provider";
import { useEffect, useState } from "react";
import { TodoComment, ActivityItem } from "./todo-comment";
import { todoUtils } from "@/features/todos/lib/todo-utils";

interface TodoTimelineProps {
    todo: PopulatedTodo;
}

export const TodoTimeline = ({ todo }: TodoTimelineProps) => {
    const { data: activitiesFromComments, refetch: refetchComments } = todoActivitiesHook.useComments(todo.id);
    const socket = useSocket();
    const [activities, setActivities] = useState<ActivityItem[]>([]);

    const formatComment = (activity: TodoActivityWithUser) => {
        const avatarUrl = todoUtils.getAuthorPictureUrl(activity);
        const hash = encodeURIComponent(activity.content)
        const profileUrl = activity.agentId ? `/agents/${activity.agentId}` : undefined;
        return {
            type: 'comment' as const,
            text: activity.content,
            timestamp: new Date(activity.created),
            authorType: todoUtils.getAuthorType(activity),
            authorName: todoUtils.getAuthorName(activity),
            pictureUrl: avatarUrl,
            profileUrl,
            key: hash,
            id: activity.id
        };
    };

    useEffect(() => {
        setActivities([
            {
                type: 'comment' as const,
                text: todo.description ?? '',
                timestamp: new Date(todo.created),
                authorType: todoUtils.getAuthorType(todo),
                authorName: todoUtils.getAuthorName(todo),
                flowId: todo.flowId,
            },
            ...(activitiesFromComments?.data ?? []).map(formatComment)
        ]);
    }, [activitiesFromComments?.data]);

    useEffect(() => {
        const handleTodoChanged = (event: TodoChanged) => {
            if (event.todoId === todo.id) {
                refetchComments();
            }
        };
        const handleTodoActivityChanged = (event: TodoActivityChanged) => {
            setActivities(prev => {
                const newActivities = prev.map(activity => {
                    if (activity.id === event.activityId) {
                        return { ...activity, text: event.content };
                    }
                    return activity;
                });
                return newActivities;
            });
        };

        socket.on(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
        socket.on(WebsocketClientEvent.TODO_ACTIVITY_CHANGED, handleTodoActivityChanged);
            
        return () => {
            socket.off(WebsocketClientEvent.TODO_CHANGED, handleTodoChanged);
            socket.off(WebsocketClientEvent.TODO_ACTIVITY_CHANGED, handleTodoActivityChanged);
        };
    }, [socket, refetchComments]);

    return (
        <div className="flex flex-col mt-4">
            {activities.map((comment, index) => (
                <TodoComment 
                    key={comment.id} 
                    comment={comment} 
                    showConnector={index !== activities.length - 1} 
                />
            ))}
        </div>
    );
};
