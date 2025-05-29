import { ApMarkdown } from "@/components/custom/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatUtils } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MarkdownVariant } from "@activepieces/shared";

type CommentProps = {
    text: string;
    timestamp: Date;
    author?: string;
    avatarUrl?: string;
    isNew?: boolean;
}

const getInitials = (name?: string) => {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

export const TodoComment = ({ text, timestamp, author, avatarUrl, isNew }: CommentProps) => {
    return (
        <div className={cn(
            "flex gap-3 items-start bg-secondary rounded-lg p-3 transition-all duration-500",
            isNew && "animate-highlight"
        )}>
            <Avatar className="w-10 h-10">
                {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={author} />
                ) : (
                    <AvatarFallback className="text-xs font-bold border">
                        {getInitials(author)}
                    </AvatarFallback>
                )}
            </Avatar>
            <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{author}</span>
                    <span className="text-sm opacity-70">{formatUtils.formatDateToAgo(timestamp)}</span>
                </div>
                <div className="text-sm leading-relaxed">
                    <ApMarkdown markdown={text} variant={MarkdownVariant.BORDERLESS} />
                </div>
            </div>
        </div>
    );
}; 