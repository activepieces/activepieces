import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { CreateTagDialog } from '@/app/routes/platform/setup/pieces/create-tag-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { piecesTagQueries, piecesTagMutations } from '@/features/platform-admin';

type ApplyTagsProps = {
  selectedPieces: PieceMetadataModelSummary[];
  onApplyTags: () => void;
};

const ApplyTags = ({ selectedPieces, onApplyTags }: ApplyTagsProps) => {
  const { data: tags = [] } = piecesTagQueries.useTags();
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const tagsThatHaveBeenClickedRef = useRef<Set<string>>(new Set());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  useEffect(() => {
    setSelectedTags(
      new Set(
        tags
          .map((tag) => tag.name)
          .filter((tag) =>
            selectedPieces.every((piece) => piece.tags?.includes(tag)),
          ),
      ),
    );
  }, [selectedPieces, tags]);

  const { mutate: applyTags } = piecesTagMutations.useApplyTags({
    onSuccess: () => onApplyTags(),
  });

  const [tagOptions, setTagOptions] = useState<
    { label: string; value: string }[]
  >([]);
  useEffect(() => {
    setTagOptions(
      tags.map((tag) => ({
        label: tag.name,
        value: tag.name,
      })),
    );
  }, [tags]);

  return (
    <Popover
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        tagsThatHaveBeenClickedRef.current = new Set();
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={selectedPieces.length === 0}
        >
          {t('Apply Tags')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandList>
            {tagOptions.length === 0 ? (
              <CommandEmpty>{t('No tags created.')}</CommandEmpty>
            ) : (
              <ScrollArea viewPortClassName="max-h-[200px]">
                <CommandGroup>
                  {tagOptions.map((option) => {
                    const isSelected = selectedTags.has(option.value);
                    const isIndeterminate =
                      selectedPieces.some((piece) =>
                        piece.tags?.includes(option.value),
                      ) &&
                      !selectedPieces.every((piece) =>
                        piece.tags?.includes(option.value),
                      ) &&
                      !tagsThatHaveBeenClickedRef.current.has(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          tagsThatHaveBeenClickedRef.current.add(option.value);
                          const newSelectedTags = new Set(selectedTags);
                          if (isSelected && !isIndeterminate) {
                            newSelectedTags.delete(option.value);
                          } else {
                            newSelectedTags.add(option.value);
                          }
                          setSelectedTags(newSelectedTags);
                        }}
                      >
                        <Checkbox
                          checked={
                            isIndeterminate ? 'indeterminate' : isSelected
                          }
                          className="mr-2"
                        ></Checkbox>

                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </ScrollArea>
            )}

            <CreateTagDialog
              onTagCreated={(tag) => {
                if (tagOptions.some((option) => option.value === tag.name)) {
                  return;
                }
                setTagOptions([
                  ...tagOptions,
                  { label: tag.name, value: tag.name },
                ]);
              }}
              isOpen={createDialogOpen}
              setIsOpen={setCreateDialogOpen}
            >
              <CommandItem
                className="justify-center text-center"
                onSelect={(e) => {
                  setCreateDialogOpen(true);
                }}
              >
                + {t('New Tag')}
              </CommandItem>
            </CreateTagDialog>
            <Separator />
            <CommandGroup>
              <CommandItem
                className="justify-center text-center text-primary"
                onSelect={(e) => {
                  toast(t('Applying Tags...'), {});
                  applyTags({
                    piecesName: selectedPieces.map((piece) => piece.name),
                    tags: Array.from(selectedTags),
                  });
                  setOpen(false);
                }}
              >
                {t('Apply Tags')}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

ApplyTags.displayName = 'ApplyTags';
export { ApplyTags };
