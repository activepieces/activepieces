import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState, useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { EmojiSelector } from '@/components/ui/emoji-picker';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { validationUtils } from '@/lib/utils';
import { Folder } from '@activepieces/shared';

import { foldersApi } from '../lib/folders-api';

interface RenameFolderDialogProps {
  folderId: string;
  name: string;
  onRename: () => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const RenameFolderFormSchema = Type.Object({
  displayName: Type.String({
    errorMessage: t('Please enter folder name'),
  }),
});

type RenameFolderFormSchema = Static<typeof RenameFolderFormSchema>;

export const RenameFolderDialog = ({
  folderId,
  name,
  onRename,
  children,
  open,
  onOpenChange,
}: RenameFolderDialogProps) => {
  const [isControlled] = useState(
    open !== undefined && onOpenChange !== undefined,
  );
  const [isUncontrolledOpen, setIsUncontrolledOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  useEffect(() => {
    if (name) {
      const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
      const match = name.match(emojiRegex);

      if (match && match[0]) {
        setSelectedEmoji(match[0]);
      }
    }
  }, [name]);

  const getDisplayNameWithoutEmoji = () => {
    if (!name) return '';

    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    return name.replace(emojiRegex, '').trim();
  };

  const form = useForm<RenameFolderFormSchema>({
    resolver: typeboxResolver(RenameFolderFormSchema),
    defaultValues: {
      displayName: getDisplayNameWithoutEmoji(),
    },
  });

  const { mutate, isPending } = useMutation<
    Folder,
    Error,
    RenameFolderFormSchema
  >({
    mutationFn: async (data) => {
      const displayName = selectedEmoji
        ? `${selectedEmoji} ${data.displayName}`
        : data.displayName;

      return await foldersApi.renameFolder(folderId, {
        displayName: displayName,
      });
    },
    onSuccess: () => {
      handleClose();
      onRename();
      toast({
        title: t('Renamed flow successfully'),
      });
    },
    onError: (err) => {
      if (validationUtils.isValidationError(err)) {
        form.setError('displayName', {
          message: t('Folder name already used'),
        });
      } else {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  const handleEmojiSelect = (emoji: { emoji: string }) => {
    setSelectedEmoji(emoji.emoji);
  };

  const handleClose = () => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setIsUncontrolledOpen(false);
    }
  };

  const isOpen = isControlled ? open : isUncontrolledOpen;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={isControlled ? onOpenChange : setIsUncontrolledOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t('Rename Folder')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <EmojiSelector
                      selectedEmoji={selectedEmoji}
                      onEmojiSelect={handleEmojiSelect}
                    />
                    <Input
                      {...field}
                      required
                      id="folder"
                      placeholder={t('Folder Name')}
                      className="rounded-sm"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <DialogFooter className="mt-4">
              <Button
                variant={'outline'}
                onClick={() => handleClose()}
                type="button"
              >
                {t('Cancel')}
              </Button>
              <Button type="submit" loading={isPending}>
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
