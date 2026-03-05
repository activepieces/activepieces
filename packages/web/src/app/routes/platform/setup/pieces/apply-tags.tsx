import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Trash } from 'lucide-react';
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
import { piecesTagsApi } from '@/features/platform-admin';

type ApplyTagsProps = {
  selectedPieces: PieceMetadataModelSummary[];
  onApplyTags: () => void;
};

const ApplyTags = ({ selectedPieces, onApplyTags }: ApplyTagsProps) => {
  const queryClient = useQueryClient();
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await piecesTagsApi.list({ limit: 100 });
      return response.data;
    },
  });
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

  const { mutate: applyTags } = useMutation({
    mutationFn: async (tags: string[]) => {
      setSelectedTags(new Set(tags));
      toast(t('Applying Tags...'), {});
      await piecesTagsApi.tagPieces({
        piecesName: selectedPieces.map((piece) => piece.name),
        tags,
      });
    },
    onSuccess: () => {
      toast(t('Tags applied.'), {});
      onApplyTags();
    },
  });

  const { mutate: deleteTag } = useMutation({
    mutationFn: async ({ tagId }: { tagId: string; tagName: string }) => {
      await piecesTagsApi.delete(tagId);
    },
    onSuccess: (_, { tagId, tagName }) => {
      toast(t(`Tag "${tagName}" has been deleted successfully`), {});
      setTagOptions((prev) => prev.filter((option) => option.value !== tagId));
      setSelectedTags((prev) => {
        const next = new Set(prev);
        next.delete(tagId);
        return next;
      });
      queryClient.setQueryData(['tags'], (prev: typeof tags) =>
        prev.filter((tag) => tag.id !== tagId),
      );
    },
    onError: () => {
      toast.error(t('Failed to delete tag'), {});
      queryClient.refetchQueries({ queryKey: ['tags'] });
    },
  });

  const [tagOptions, setTagOptions] = useState<
    { label: string; value: string }[]
  >([]);
  useEffect(() => {
    setTagOptions(
      tags.map((tag) => ({
        label: tag.name,
        value: tag.id,
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
                        className="flex items-center justify-between"
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
                        <div className="flex items-center flex-1">
                          <Checkbox
                            checked={
                              isIndeterminate ? 'indeterminate' : isSelected
                            }
                            className="mr-2"
                          />
                          <span className="flex-1">{option.label}</span>
                        </div>

                        <button
                          type="button"
                          className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 focus:outline-none"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            deleteTag({
                              tagId: option.value,
                              tagName: option.label,
                            });
                          }}
                          title="Delete tag"
                        >
                          <Trash size={14} />
                        </button>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </ScrollArea>
            )}

            <CreateTagDialog
              onTagCreated={(tag) => {
                if (tagOptions.some((option) => option.value === tag.id)) {
                  return;
                }
                setTagOptions([
                  ...tagOptions,
                  { label: tag.name, value: tag.id },
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
                  applyTags(Array.from(selectedTags));
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
