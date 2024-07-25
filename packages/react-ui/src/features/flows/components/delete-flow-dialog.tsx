import { FlowVersion } from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogDescription } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import React from 'react';
import { useForm } from 'react-hook-form';

import { flowsApi } from '../lib/flows-api';

import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';

const DeleteFlowSchema = Type.Object({
  delete: Type.String(),
});

type DeleteFlowSchema = Static<typeof DeleteFlowSchema>;

type DeleteFlowDialogProps = {
  flowId: string;
  flowVersion: FlowVersion;
  setIsDeleteDialogOpen: (isOpen: boolean) => void;
  onDelete: () => void;
};

const DeleteFlowDialog: React.FC<DeleteFlowDialogProps> = ({
  flowId,
  flowVersion,
  setIsDeleteDialogOpen,
  onDelete,
}) => {
  const deleteFlowForm = useForm<DeleteFlowSchema>({
    resolver: typeboxResolver(DeleteFlowSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => flowsApi.delete(flowId),
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      onDelete();
      toast({
        title: 'Success',
        description: 'Flow has been deleted.',
        duration: 3000,
      });
    },
    onError: () => toast(INTERNAL_ERROR_TOAST),
  });

  const onDeleteFlowSubmit = () => {
    mutate();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Flow {flowVersion.displayName}</DialogTitle>
        <DialogDescription>
          <span>
            This will permanently delete the flow, all its data and any
            background runs.
          </span>
        </DialogDescription>
      </DialogHeader>
      <Form {...deleteFlowForm}>
        <form className="grid space-y-4">
          <FormField
            control={deleteFlowForm.control}
            name="delete"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Input
                  {...field}
                  required
                  id="delete"
                  placeholder="Type DELETE and press confirm to continue"
                  className="rounded-sm"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          {deleteFlowForm?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {deleteFlowForm.formState.errors.root.serverError.message}
            </FormMessage>
          )}
          <Button
            loading={isPending}
            onClick={(e) => deleteFlowForm.handleSubmit(onDeleteFlowSubmit)(e)}
            className="bg-destructive hover:bg-destructive/90"
          >
            Confirm
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};

DeleteFlowDialog.displayName = 'DeleteFlowDialog';

export { DeleteFlowDialog };
