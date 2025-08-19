import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import React, { useState } from 'react';
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

import { globalConnectionsMutations } from '../lib/global-connections-hooks';

import { AssignConnectionToProjectsControl } from './assign-global-connection-to-projects';

const EditGlobalConnectionSchema = Type.Object({
  displayName: Type.String(),
  projectIds: Type.Array(Type.String()),
});

type EditGlobalConnectionSchema = Static<typeof EditGlobalConnectionSchema>;

type EditGlobalConnectionDialogProps = {
  connectionId: string;
  currentName: string;
  projectIds: string[];
  onEdit: () => void;
  userHasPermissionToEdit: boolean;
};

const EditGlobalConnectionDialog: React.FC<EditGlobalConnectionDialogProps> = ({
  connectionId,
  currentName,
  projectIds,
  onEdit,
  userHasPermissionToEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const editConnectionForm = useForm<EditGlobalConnectionSchema>({
    resolver: typeboxResolver(EditGlobalConnectionSchema),
    defaultValues: {
      displayName: currentName,
      projectIds: projectIds,
    },
  });

  const {
    mutate: updateGlobalConnection,
    isPending: isUpdatingGlobalConnection,
  } = globalConnectionsMutations.useUpdateGlobalConnection(
    onEdit,
    setIsOpen,
    editConnectionForm,
  );

  return (
    <Tooltip>
      <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
        <DialogTrigger asChild>
          <>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={!userHasPermissionToEdit}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setIsOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!userHasPermissionToEdit ? t('Permission needed') : t('Edit')}
            </TooltipContent>
          </>
        </DialogTrigger>
        <DialogContent onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t('Edit Global Connection')}</DialogTitle>
          </DialogHeader>
          <Form {...editConnectionForm}>
            <form
              onSubmit={editConnectionForm.handleSubmit((data) =>
                updateGlobalConnection({
                  connectionId,
                  displayName: data.displayName,
                  projectIds: data.projectIds,
                  currentName: currentName,
                }),
              )}
            >
              <div className="grid space-y-4">
                <FormField
                  control={editConnectionForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem className="grid space-y-2">
                      <Label htmlFor="displayName">{t('Name')}</Label>
                      <Input
                        {...field}
                        id="displayName"
                        placeholder={t('Connection Name')}
                        className="rounded-sm"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <AssignConnectionToProjectsControl
                  control={editConnectionForm.control}
                  name="projectIds"
                />
                {editConnectionForm?.formState?.errors?.root?.serverError && (
                  <FormMessage>
                    {
                      editConnectionForm.formState.errors.root.serverError
                        .message
                    }
                  </FormMessage>
                )}
              </div>
              <DialogFooter className="mt-8">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isUpdatingGlobalConnection}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setIsOpen(false);
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button loading={isUpdatingGlobalConnection}>
                  {t('Save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Tooltip>
  );
};

export { EditGlobalConnectionDialog };
