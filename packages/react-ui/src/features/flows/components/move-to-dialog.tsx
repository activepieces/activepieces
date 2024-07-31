import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

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
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { foldersHooks } from '@/features/folders/lib/folders-hooks';
import {
  Flow,
  FlowOperationType,
  FlowVersion,
  PopulatedFlow,
} from '@activepieces/shared';

import { flowsApi } from '../lib/flows-api';

const MoveToFormSchema = Type.Object({
  folder: Type.String({
    errorMessage: 'Please select a folder',
  }),
});

type MoveToFormSchema = Static<typeof MoveToFormSchema>;

type MoveToDialogProps = {
  children: React.ReactNode;
  flow: Flow;
  flowVersion: FlowVersion;
  onMoveTo: () => void;
};
const MoveToDialog = ({
  children,
  flow,
  flowVersion,
  onMoveTo,
}: MoveToDialogProps) => {
  const form = useForm<MoveToFormSchema>({
    resolver: typeboxResolver(MoveToFormSchema),
  });

  const { data } = foldersHooks.useFolders();

  const { mutate, isPending } = useMutation<
    PopulatedFlow,
    Error,
    { folder: string }
  >({
    mutationFn: async (data) => {
      return await flowsApi.update(flow.id, {
        type: FlowOperationType.CHANGE_FOLDER,
        request: {
          folderId: data.folder,
        },
      });
    },
    onSuccess: () => {
      onMoveTo();
      toast({
        title: 'Moved flow successfully',
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const onSubmit: SubmitHandler<{
    folder: string;
  }> = (data) => {
    mutate(data);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {flowVersion.displayName}</DialogTitle>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="folder"
              render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Folder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {data?.data.map((folder) => (
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
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export { MoveToDialog };
