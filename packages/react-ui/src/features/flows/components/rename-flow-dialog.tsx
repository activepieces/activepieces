import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { FlowOperationType, PopulatedFlow } from '@activepieces/shared';

const RenameFlowSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    errorMessage: t('Flow name cannot be empty'),
  }),
});

type RenameFlowSchema = Static<typeof RenameFlowSchema>;

type RenameFlowDialogProps = {
  children: React.ReactNode;
  flowId: string;
  onRename: (newName: string) => void;
  flowName: string;
};

const RenameFlowDialog: React.FC<RenameFlowDialogProps> = ({
  children,
  flowId,
  onRename,
  flowName,
}) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const renameFlowForm = useForm<RenameFlowSchema>({
    resolver: typeboxResolver(RenameFlowSchema),
    defaultValues: {
      displayName: flowName,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isRenameDialogOpen) {
      renameFlowForm.reset({
        displayName: flowName,
      });
      renameFlowForm.clearErrors();
    }
  }, [isRenameDialogOpen, flowName, renameFlowForm]);

  const { mutate, isPending } = useMutation<
    PopulatedFlow,
    Error,
    {
      flowId: string;
      displayName: string;
    }
  >({
    mutationFn: ({ displayName }) =>
      flowsApi.update(flowId, {
        type: FlowOperationType.CHANGE_NAME,
        request: { displayName },
      }),
    onSuccess: (_, variables) => {
      setIsRenameDialogOpen(false);
      onRename(variables.displayName);
      toast.success(t('Flow has been renamed.'), {
        duration: 3000,
      });
      renameFlowForm.reset({
        displayName: variables.displayName,
      });
    },
    onError: (error) => {
      // Handle server validation errors
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        renameFlowForm.setError('displayName', {
          type: 'manual',
          message: t('A flow with this name already exists.'),
        });
      } else {
        toast.error(t('Failed to rename flow. Please try again.'));
      }
    },
  });

  const onSubmit = (data: RenameFlowSchema) => {
    const trimmedName = data.displayName.trim();
    
    // Check if name is the same as current name
    if (trimmedName === flowName) {
      renameFlowForm.setError('displayName', {
        type: 'manual',
        message: t('The new name must be different from the current name.'),
      });
      return;
    }
    
    mutate({
      flowId,
      displayName: trimmedName,
    });
  };

  return (
    <Dialog
      open={isRenameDialogOpen}
      onOpenChange={(open) => {
        setIsRenameDialogOpen(open);
        if (!open) {
          renameFlowForm.reset({
            displayName: flowName,
          });
          renameFlowForm.clearErrors();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('Rename')} {flowName}
          </DialogTitle>
        </DialogHeader>
        <Form {...renameFlowForm}>
          <form
            className="grid space-y-4"
            onSubmit={renameFlowForm.handleSubmit(onSubmit)}
          >
            <FormField
              control={renameFlowForm.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="displayName">{t('Name')}</Label>
                  <Input
                    {...field}
                    id="displayName"
                    placeholder={t('New Flow Name')}
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
            <Button loading={isPending} type="submit">
              {t('Confirm')}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { RenameFlowDialog };