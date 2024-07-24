import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { FlowOperationType, PopulatedFlow } from '@activepieces/shared';

const RenameFlowSchema = Type.Object({
  displayName: Type.String(),
});

type RenameFlowSchema = Static<typeof RenameFlowSchema>;

const RenameFlowDialog: React.FC<{
  flowId: string;
  setIsRenameDialogOpen: (isOpen: boolean) => void;
  onRename: () => void;
}> = ({ flowId, setIsRenameDialogOpen, onRename }) => {
  const renameFlowForm = useForm<RenameFlowSchema>({
    resolver: typeboxResolver(RenameFlowSchema),
  });

  const { mutate, isPending } = useMutation<
    PopulatedFlow,
    Error,
    {
      flowId: string;
      displayName: string;
    }
  >({
    mutationFn: () =>
      flowsApi.update(flowId, {
        type: FlowOperationType.CHANGE_NAME,
        request: {
          displayName: renameFlowForm.getValues().displayName,
        },
      }),
    onSuccess: () => {
      setIsRenameDialogOpen(false);
      onRename();
      toast({
        title: 'Success',
        description: 'Flow has been renamed.',
        duration: 3000,
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const onRenameFlowSubmit: SubmitHandler<{
    displayName: string;
  }> = (data) => {
    mutate({
      flowId,
      displayName: data.displayName,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Rename Flow</DialogTitle>
      </DialogHeader>
      <Form {...renameFlowForm}>
        <form
          className="grid space-y-4"
          onSubmit={renameFlowForm.handleSubmit(onRenameFlowSubmit)}
        >
          <FormField
            control={renameFlowForm.control}
            name="displayName"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  {...field}
                  required
                  id="displayName"
                  placeholder="New Flow Name"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {renameFlowForm?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {renameFlowForm.formState.errors.root.serverError.message}
            </FormMessage>
          )}
          <Button loading={isPending}>Confirm</Button>
        </form>
      </Form>
    </DialogContent>
  );
};

export { RenameFlowDialog };
