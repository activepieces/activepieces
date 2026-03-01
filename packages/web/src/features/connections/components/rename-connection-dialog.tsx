import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogClose, DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { useState, forwardRef } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { appConnectionsMutations } from '../lib/app-connections-hooks';

const RenameConnectionSchema = Type.Object({
  displayName: Type.String(),
});

type RenameConnectionSchema = Static<typeof RenameConnectionSchema>;

type RenameConnectionDialogProps = {
  connectionId: string;
  currentName: string;
  userHasPermissionToRename: boolean;
  onRename: () => void;
};

const RenameConnectionDialog = forwardRef<
  HTMLDivElement,
  RenameConnectionDialogProps
>(({ connectionId, currentName, userHasPermissionToRename, onRename }, _) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const renameConnectionForm = useForm<RenameConnectionSchema>({
    resolver: typeboxResolver(RenameConnectionSchema),
    defaultValues: {
      displayName: currentName,
    },
  });

  const { mutate: renameConnection, isPending } =
    appConnectionsMutations.useRenameAppConnection({
      currentName,
      setIsRenameDialogOpen,
      renameConnectionForm,
      refetch: onRename,
    });

  return (
    <Tooltip>
      <Dialog
        open={isRenameDialogOpen}
        onOpenChange={(open) => setIsRenameDialogOpen(open)}
      >
        <DialogTrigger asChild>
          <>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!userHasPermissionToRename}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsRenameDialogOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!userHasPermissionToRename ? t('Permission needed') : t('Edit')}
            </TooltipContent>
          </>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('Rename')} {currentName}
            </DialogTitle>
          </DialogHeader>
          <Form {...renameConnectionForm}>
            <form
              className="grid space-y-4"
              onSubmit={renameConnectionForm.handleSubmit((data) =>
                renameConnection({
                  connectionId,
                  displayName: data.displayName,
                }),
              )}
            >
              <FormField
                control={renameConnectionForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label htmlFor="displayName">{t('Name')}</Label>
                    <Input
                      {...field}
                      id="displayName"
                      placeholder={t('New Connection Name')}
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {renameConnectionForm?.formState?.errors?.root?.serverError && (
                <FormMessage>
                  {
                    renameConnectionForm.formState.errors.root.serverError
                      .message
                  }
                </FormMessage>
              )}
              <DialogFooter className="justify-end">
                <DialogClose asChild>
                  <Button variant={'outline'}>{t('Cancel')}</Button>
                </DialogClose>

                <Button loading={isPending}>{t('Confirm')}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
});

RenameConnectionDialog.displayName = 'RenameConnectionDialog';

export { RenameConnectionDialog };
