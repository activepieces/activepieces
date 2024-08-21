import { useState } from 'react';
import { t } from 'i18next';
import { EllipsisVertical, Folder, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { TextWithIcon } from '@/components/ui/text-with-icon';
import { cn } from '@/lib/utils';
import { RenameFolderDialog } from '../rename-folder-dialog';
import { foldersApi } from '../../lib/folders-api';


type FolderItemProps = {
    refetch: () => void;
    folderId: string | undefined;
    folderDisplayName: string;
    numberOfFlows: number;
    updateSearchParams: (folderId: string | undefined) => void;
    selectedFolderId: string | null;
    disableMenu: boolean
};
const FolderItem = ({
    refetch,
    folderId,
    folderDisplayName,
    updateSearchParams,
    numberOfFlows,
    selectedFolderId,
    disableMenu
}: FolderItemProps) => {
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

    return (
        <div key={folderId} className="group py-1">
            <Button
                variant="ghost"
                className={cn('w-full  items-center justify-start gap-2', {
                    'bg-muted': selectedFolderId === folderId,
                })}
                onClick={() => updateSearchParams(folderId)}
            >
                <TextWithIcon
                    className="flex-grow"
                    icon={
                        selectedFolderId === folderId && !disableMenu ? (
                            <FolderOpen
                                size={'18px'}
                                className="fill-muted-foreground/75 border-0 text-muted-foreground flex-shrink-0"
                            />
                        ) : (
                            <Folder
                                size={'18px'}
                                className={cn(" border-0 text-muted-foreground flex-shrink-0", {
                                    "fill-muted-foreground ": !disableMenu
                                })}
                            />
                        )
                    }
                    text={
                        <div className="flex-grow whitespace-break-spaces break-all text-start truncate">
                            {folderDisplayName}
                        </div>
                    }
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex flex-row -space-x-4 min-w-5"
                    >

                        <DropdownMenu onOpenChange={setIsActionMenuOpen} modal={false}>
                            <DropdownMenuTrigger
        
                                asChild
                            >
                                <div
                                    className={'flex items-center cursor-pointer'}
                                    onClick={(e) => {
                                        if (!disableMenu) {
                                            setIsActionMenuOpen(!isActionMenuOpen);
                                        }
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <div className={cn("invisible h-5 w-5", {
                                        visible: isActionMenuOpen,
                                        'group-hover:visible': !disableMenu,
                                    })} >
                                        <EllipsisVertical className="h-5 w-5" />
                                    </div>
                                    <span className={cn(
                                        'text-muted-foreground self-end ',
                                        {
                                            invisible: isActionMenuOpen && !disableMenu,
                                            'group-hover:invisible': !disableMenu,
                                        },
                                    )}>
                                        {numberOfFlows}
                                    </span>
                                </div>

                            </DropdownMenuTrigger>

                            <DropdownMenuContent>
                                <RenameFolderDialog
                                    folderId={folderId!}
                                    onRename={() => refetch()}
                                >
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <div className="flex flex-row gap-2 items-center">
                                            <Pencil className="h-4 w-4" />
                                            <span>{t('Rename')}</span>
                                        </div>
                                    </DropdownMenuItem>
                                </RenameFolderDialog>
                                <ConfirmationDeleteDialog
                                    title={t('Delete folder {{folderName}}', {
                                        folderName: folderDisplayName,
                                    })}
                                    message={t(
                                        'If you delete this folder, we will keep its flows and move them to Uncategorized.',
                                    )}
                                    mutationFn={async () => {
                                        await foldersApi.delete(folderId!);
                                        refetch();
                                    }}
                                    entityName={folderDisplayName}
                                >
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <div className="flex flex-row gap-2 items-center">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                            <span className="text-destructive">{t('Delete')}</span>
                                        </div>
                                    </DropdownMenuItem>
                                </ConfirmationDeleteDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </TextWithIcon>
            </Button>
        </div>
    );
};

export { FolderItem };