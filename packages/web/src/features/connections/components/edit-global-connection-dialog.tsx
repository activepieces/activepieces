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
  displayName: z.string(),
  projectIds: z.array(z.string()),
  preSelectForNewProjects: z.boolean(),
});

type EditGlobalConnectionSchema = z.infer<typeof EditGlobalConnectionSchema>;

const EditGlobalConnectionDialog: React.FC<EditGlobalConnectionDialogProps> = ({
  connectionId,
  currentName,
  projectIds,
  preSelectForNewProjects,
  onEdit,
  userHasPermissionToEdit,
  open,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setIsOpen = (next: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!userHasPermissionToEdit}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(true);
              }}
            >
              <Pencil />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {!userHasPermissionToEdit ? t('Permission needed') : t('Edit')}
          </TooltipContent>
        </Tooltip>
      )}
      <DialogContent onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('Edit global connection')}</DialogTitle>
        </DialogHeader>
        <EditGlobalConnectionForm
          key={isOpen ? `open-${connectionId}` : 'closed'}
          connectionId={connectionId}
          currentName={currentName}
          projectIds={projectIds}
          preSelectForNewProjects={preSelectForNewProjects}
          onEdit={onEdit}
          setIsOpen={setIsOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

function EditGlobalConnectionForm({
  connectionId,
  currentName,
  projectIds,
  preSelectForNewProjects,
  onEdit,
  setIsOpen,
}: {
  connectionId: string;
  currentName: string;
  projectIds: string[];
  preSelectForNewProjects: boolean;
  onEdit: () => void;
  setIsOpen: (open: boolean) => void;
}) {
  const editConnectionForm = useForm<EditGlobalConnectionSchema>({
    resolver: zodResolver(EditGlobalConnectionSchema),
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
    setIsOpen,
    editConnectionForm,
  );

  return (
    <Form {...editConnectionForm}>
      <form
        className="flex flex-col gap-4"
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
        <div className="flex flex-col gap-4">
          <GlobalConnectionWarning />
          <FormField
            control={editConnectionForm.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="displayName">{t('Name')}</Label>
                <Input
                  {...field}
                  id="displayName"
                  placeholder={t('Connection Name')}
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
        <DialogFooter>
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
          <Button type="submit" loading={isUpdatingGlobalConnection}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export { EditGlobalConnectionDialog };

type EditGlobalConnectionDialogProps = {
  connectionId: string;
  currentName: string;
  projectIds: string[];
  preSelectForNewProjects: boolean;
  onEdit: () => void;
  userHasPermissionToEdit: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
