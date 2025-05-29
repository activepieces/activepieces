import { Activity, Clock } from "lucide-react";
import { isNil, Todo, TodoActivityChanged, TodoActivityWithUser, TodoChanged, WebsocketClientEvent } from "@activepieces/shared";
import { formatUtils } from "@/lib/utils";
import { TodoComment } from "./todo-comment";
import { todosCommentsHook as todosActivitiesHook } from "@/features/todos/lib/todos-activity-hook";
import { TodoCreateComment } from "./todo-create-comment";
import { useSocket } from "@/components/socket-provider";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";


type ActivityItem = {
    type: 'comment' | 'action';
    text: string;
    timestamp: Date;
    author?: string;
    avatarUrl?: string;
    key?: string;
    id?: string;
}

type TodoActivityProps = {
    todo: Todo;
}

export const TodoActivitiesSection = ({ todo }: TodoActivityProps) => {
    const { data: activitiesFromComments, refetch: refetchComments } = todosActivitiesHook.useComments(todo.id);
    const socket = useSocket();
    const [lastCommentId, setLastCommentId] = useState<string | undefined>();
    const lastCommentRef = useRef<HTMLDivElement>(null);


    const formatComment = (activity: TodoActivityWithUser) => {
        const author = !isNil(activity.userId) ? activity.user?.firstName + ' ' + activity.user?.lastName : activity.agentId ? activity.agent?.displayName : undefined;
        const avatarUrl = !isNil(activity.agentId) ? activity.agent?.profilePictureUrl : undefined;
        const hash = encodeURIComponent(activity.content)
        return {
            type: 'comment' as const,
            text: activity.content,
            timestamp: new Date(activity.created),
            author: author,
            avatarUrl: avatarUrl,
            key: hash,
            id: activity.id
        };
    };

    const [activities, setActivities] = useState<ActivityItem[]>([]);

    useEffect(() => {
        setActivities([
            {
                type: 'action',
                text: 'This todo was created',
                timestamp: new Date(todo.created)
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

    useEffect(() => {
        if (activitiesFromComments?.data?.length) {
            const latestComment = activitiesFromComments.data[activitiesFromComments.data.length - 1];
            if (latestComment.id !== lastCommentId) {
                if (!isNil(lastCommentId)) {
                    setTimeout(() => {
                        lastCommentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 100);
                }
                setLastCommentId(latestComment.id);

            }
        }
    }, [activitiesFromComments?.data]);



    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <h3 className="text-base font-bold">Activity</h3>
            </div>
            <div className="flex flex-col gap-4 mt-6">
                {activities.map((activity, index) => (
                    activity.type === 'comment' ? (
                        <div
                            key={activity.key}
                            ref={activity.id === lastCommentId ? lastCommentRef : undefined}
                        >
                            <TodoComment
                                text={activity.text}
                                timestamp={activity.timestamp}
                                author={activity.author}
                                avatarUrl={activity.avatarUrl}
                                isNew={activity.id === lastCommentId}
                            />
                        </div>
                    ) : (
                        <div
                            key={index}
                            className="flex items-center gap-3 pl-2"
                        >
                            <Clock className="h-4 w-5" />
                            <span className="text-sm font-medium">{activity.text}</span>
                            <span className="text-sm opacity-70">{formatUtils.formatDateToAgo(activity.timestamp)}</span>
                        </div>
                    )
                ))}
            </div>
            <TodoCreateComment
                todo={todo}
                onCommentCreated={refetchComments}
            />
        </div>
    );
};