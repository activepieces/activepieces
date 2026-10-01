import { formErrors } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { GlobalConnectionWarning } from '@/components/custom/global-connection-utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

import { ProjectSelector } from '../../projects/components/projects-selector';
import { globalConnectionsMutations } from '../hooks/global-connections-hooks';

const EditGlobalConnectionSchema = z.object({
  displayName: z.string().trim().min(1, formErrors.required),
  projectIds: z.array(z.string()),
  preSelectForNewProjects: z.boolean(),
});

type EditGlobalConnectionSchema = z.infer<typeof EditGlobalConnectionSchema>;

const EditGlobalConnectionDialog: React.FC<EditGlobalConnectionDialogProps> = ({
  userHasPermissionToEdit,
  ...connection
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Tooltip>
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
      </Tooltip>
      <EditGlobalConnectionFormDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        {...connection}
      />
    </>
  );
};

const EditGlobalConnectionFormDialog: React.FC<
  EditGlobalConnectionFormDialogProps
> = ({ open, onOpenChange, ...connection }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('Edit Global Connection')}</DialogTitle>
        </DialogHeader>
        <EditGlobalConnectionForm
          key={open ? 'open' : 'closed'}
          onOpenChange={onOpenChange}
          {...connection}
        />
      </DialogContent>
    </Dialog>
  );
};

const EditGlobalConnectionForm = ({
  connectionId,
  currentName,
  projectIds,
  preSelectForNewProjects,
  onEdit,
  onOpenChange,
}: EditGlobalConnectionFormProps) => {
  const editConnectionForm = useForm<EditGlobalConnectionSchema>({
    resolver: zodResolver(EditGlobalConnectionSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: currentName,
      projectIds: projectIds,
      preSelectForNewProjects: preSelectForNewProjects,
    },
  });

  const {
    mutate: updateGlobalConnection,
    isPending: isUpdatingGlobalConnection,
  } = globalConnectionsMutations.useUpdateGlobalConnection(
    onEdit,
    onOpenChange,
    editConnectionForm,
  );

  return (
    <Form {...editConnectionForm}>
      <form
        onSubmit={editConnectionForm.handleSubmit((data) =>
          updateGlobalConnection({
            connectionId,
            displayName: data.displayName,
            projectIds: data.projectIds,
            preSelectForNewProjects: data.preSelectForNewProjects,
            currentName: currentName,
          }),
        )}
      >
        <div className="grid space-y-4">
          <GlobalConnectionWarning />
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
          <ProjectSelector
            control={editConnectionForm.control}
            name="projectIds"
          />
          <FormField
            control={editConnectionForm.control}
            name="preSelectForNewProjects"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3">
                <Checkbox
                  id="preSelectForNewProjects"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label
                  htmlFor="preSelectForNewProjects"
                  className="cursor-pointer"
                >
                  {t('Include by default in new projects')}
                </Label>
              </FormItem>
            )}
          />
          {editConnectionForm?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {editConnectionForm.formState.errors.root.serverError.message}
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
              onOpenChange(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button type="submit" loading={isUpdatingGlobalConnection}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

type GlobalConnectionEditTarget = {
  connectionId: string;
  currentName: string;
  projectIds: string[];
  preSelectForNewProjects: boolean;
  onEdit: () => void;
};

type EditGlobalConnectionDialogProps = GlobalConnectionEditTarget & {
  userHasPermissionToEdit: boolean;
};

type EditGlobalConnectionFormDialogProps = GlobalConnectionEditTarget & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type EditGlobalConnectionFormProps = GlobalConnectionEditTarget & {
  onOpenChange: (open: boolean) => void;
};

export { EditGlobalConnectionDialog, EditGlobalConnectionFormDialog };
