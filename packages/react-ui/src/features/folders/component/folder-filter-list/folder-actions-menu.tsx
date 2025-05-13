import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FolderDto } from '@activepieces/shared';

import { FolderAction } from './folder-action';

interface FolderActionsMenuProps {
  moreFolders: FolderDto[];
  showMoreFolders: boolean;
  setShowMoreFolders: (show: boolean) => void;
  selectedFolderId: string | null;
  updateSearchParams: (folderId: string | undefined) => void;
  refetchFolders: () => Promise<void>;
  userHasPermissionToUpdateFolders: boolean;
}

export const FolderActionsMenu = ({
  moreFolders,
  showMoreFolders,
  setShowMoreFolders,
  selectedFolderId,
  updateSearchParams,
  refetchFolders,
  userHasPermissionToUpdateFolders,
}: FolderActionsMenuProps) => {
  // Find the selected folder from moreFolders if it exists
  const selectedFolder = selectedFolderId
    ? moreFolders.find((folder) => folder.id === selectedFolderId)
    : null;

  const [searchQuery, setSearchQuery] = useState('');

  // Filter folders based on case-insensitive search
  const filteredFolders = searchQuery
    ? moreFolders.filter((folder) =>
        folder.displayName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : moreFolders;

  return (
    <>
      {moreFolders.length > 0 && (
        <Popover open={showMoreFolders} onOpenChange={setShowMoreFolders}>
          <PopoverTrigger asChild>
            {selectedFolder ? (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <span className="text-sm font-medium">
                  {selectedFolder.displayName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
              >
                <span className="text-xs font-semibold">
                  ({moreFolders.length})
                </span>
                more
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="py-1 px-0 w-60">
            <Command>
              <CommandInput
                placeholder="Search folders..."
                className="h-8 mb-2"
                onValueChange={setSearchQuery}
              />
              <CommandEmpty>No folders found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea viewPortClassName="max-h-[220px]">
                  {filteredFolders.map((folder) => {
                    const [emoji, ...nameParts] = folder.displayName.split(' ');
                    const name = nameParts.join(' ');

                    return (
                      <CommandItem
                        key={folder.id}
                        value={folder.displayName}
                        className={cn('flex justify-between items-center h-9', {
                          'bg-secondary': folder.id === selectedFolderId,
                        })}
                        onSelect={() => {
                          updateSearchParams(folder.id);
                          setShowMoreFolders(false);
                        }}
                      >
                        <div className="flex items-center">
                          <span className="mr-2">{emoji}</span>
                          <span className="ml-2 text-sm">
                            {name}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({folder.numberOfFlows})
                            </span>
                          </span>
                        </div>
                        <FolderAction
                          folder={folder}
                          refetch={refetchFolders}
                          userHasPermissionToUpdateFolders={
                            userHasPermissionToUpdateFolders
                          }
                        />
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};
