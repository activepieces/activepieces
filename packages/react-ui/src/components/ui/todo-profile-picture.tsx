import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Workflow } from "lucide-react";
import { AvatarImage } from "@radix-ui/react-avatar";
import { isNil } from "@activepieces/shared";

const getInitials = (name?: string) => {
    return isNil(name) ? '?' : name[0]?.toUpperCase();
};

interface TodoProfilePictureProps {
    type: 'agent' | 'user' | 'flow';
    fullName: string;
    pictureUrl?: string;
    profileUrl?: string;
    size?: string;
    includeName?: boolean;
}

export const EntityAvatar = ({
    type,
    fullName,
    pictureUrl,
    profileUrl,
    size = "w-8 h-8",
    includeName = false
}: TodoProfilePictureProps) => {
    const renderAvatar = () => {
        if (type === 'agent') {
            return (
                <Avatar className={size}>
                    <AvatarImage
                        src={pictureUrl}
                        alt={fullName}
                        className={`${size} rounded-full`}
                    />
                </Avatar>
            );
        }

        if (type === 'user') {
            return (
                <Avatar className={size}>
                    <AvatarFallback className={`text-xs font-bold border ${size}`}>
                        <span className="text-xs font-bold border p-1">
                            {getInitials(fullName)}
                        </span>
                    </AvatarFallback>
                </Avatar>
            );
        }

        return (
            <Avatar className={size}>
                <AvatarFallback className={`text-xs font-bold border ${size}`}>
                    <Workflow className="p-1" />
                </AvatarFallback>
            </Avatar>
        );
    };

    const content = (
        <div className="flex items-center gap-2">
            {renderAvatar()}
            {includeName && <span className="text-sm">{fullName}</span>}
        </div>
    );

    if (type === 'agent' && profileUrl) {
        return <Link to={profileUrl}>{content}</Link>;
    }

    return content;
};