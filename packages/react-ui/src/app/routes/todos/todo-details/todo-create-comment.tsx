import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, KeyboardEvent } from "react";
import { todoActivityApi } from "@/features/todos/lib/todos-activitiy-api";
import { Todo } from "@activepieces/shared";

type TodoCreateCommentProps = {
    todo: Todo;
    onCommentCreated: () => void;
}

export const TodoCreateComment = ({ todo, onCommentCreated }: TodoCreateCommentProps) => {
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitComment = async () => {
        if (!newComment.trim() || todo.locked) return;

        setIsSubmitting(true);
        try {
            await todoActivityApi.create(todo.id, {
                content: newComment
            });
            onCommentCreated();
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
            <div className="relative">
                <Textarea
                    placeholder="Add a comment..."
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
    );
}; 