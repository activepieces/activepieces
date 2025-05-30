import { ArrowUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, KeyboardEvent } from "react";
import { todoActivityApi } from "@/features/todos/lib/todos-activitiy-api";
import { Todo } from "@activepieces/shared";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type TodoCreateCommentProps = {
    todo: Todo;
}

const getInitials = (name?: string) => {
    return name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

export const TodoCreateComment = ({ todo }: TodoCreateCommentProps) => {
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitComment = async () => {
        if (!newComment.trim() || todo.locked) return;

        setIsSubmitting(true);
        try {
            await todoActivityApi.create(todo.id, {
                content: newComment
            });
            setNewComment("");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitComment();
        }
    };

    if (todo.locked) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 mt-4">
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs font-bold border w-8 h-8">
                            {getInitials('Mo')}
                        </AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 h-8 font-bold">
                        Add a Comment
                    </div>
                    <div className="relative mt-1">
                        <Textarea
                            placeholder="You can use markdown to format your comment"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="min-h-[100px] pr-12"
                        />
                        <Button
                            onClick={handleSubmitComment}
                            disabled={isSubmitting || !newComment.trim()}
                            className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full border 
                            enabled:hover:text-white
                            enabled:bg-primary enabled:hover:bg-primary/90 enabled:text-white"
                            size="icon"
                            variant="ghost"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};