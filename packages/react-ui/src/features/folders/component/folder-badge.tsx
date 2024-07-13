import { Badge } from "@/components/ui/badge"


type FolderBadgeProps = {
    folderId: string
}

const FolderBadge = ({folderId}: FolderBadgeProps) => {
    return (
        <Badge variant={'outline'}>
            <span>Work</span>
        </Badge>
    )
}
export { FolderBadge }