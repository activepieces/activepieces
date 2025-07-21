import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
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
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import { Flow, FlowOperationType, PopulatedFlow } from '@activepieces/shared';

import { flowsApi } from '../lib/flows-api';

const MoveFlowFormSchema = Type.Object({
  folder: Type.String({
    errorMessage: t('Please select a folder'),
  }),
});

type MoveFlowFormSchema = Static<typeof MoveFlowFormSchema>;

type MoveFlowDialogProps = {
  children: React.ReactNode;
  flows: Flow[];
  onMoveTo: (folderId: string) => void;
};

const MoveFlowDialog = ({ children, flows, onMoveTo }: MoveFlowDialogProps) => {
  const form = useForm<MoveFlowFormSchema>({
    resolver: typeboxResolver(MoveFlowFormSchema),
  });

  const { folders, isLoading } = foldersHooks.useFolders();
  const [isDialogOpened, setIsDialogOpened] = useState(false);
  const { mutate, isPending } = useMutation<
    PopulatedFlow[],
    Error,
    MoveFlowFormSchema
  >({
    mutationFn: async (data) => {
      const updatePromises = flows.map((flow) =>
        flowsApi.update(flow.id, {
          type: FlowOperationType.CHANGE_FOLDER,
          request: {
            folderId: data.folder,
          },
        }),
      );
      return await Promise.all(updatePromises);
    },
    onSuccess: () => {
      onMoveTo(form.getValues().folder);
      setIsDialogOpened(false);
      toast({
        title: t('Moved flows successfully'),
      });
    },
  });

  return (
    <Dialog onOpenChange={setIsDialogOpened} open={isDialogOpened}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Move Selected Flows')}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit((data) => mutate(data))}>
            <FormField
              control={form.control}
              name="folder"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    disabled={isLoading || folders?.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('Select Folder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {folders && folders.length === 0 && (
                          <SelectItem value="NULL">
                            {t('No Folders')}
                          </SelectItem>
                        )}
                        {folders &&
                          folders.map((folder) => (
                            <SelectItem key={folder.id} value={folder.id}>
                              {folder.displayName}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <DialogFooter>
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

export { MoveFlowDialog };
