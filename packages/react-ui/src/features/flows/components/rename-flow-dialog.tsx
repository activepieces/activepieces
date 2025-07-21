import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

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
import { toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { FlowOperationType, PopulatedFlow } from '@activepieces/shared';

const RenameFlowSchema = Type.Object({
  displayName: Type.String(),
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
        request: renameFlowForm.getValues(),
      }),
    onSuccess: () => {
      setIsRenameDialogOpen(false);
      onRename(renameFlowForm.getValues().displayName);
      toast({
        title: t('Success'),
        description: t('Flow has been renamed.'),
        duration: 3000,
      });
    },
  });

  return (
    <Dialog
      open={isRenameDialogOpen}
      onOpenChange={(open) => setIsRenameDialogOpen(open)}
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
            onSubmit={renameFlowForm.handleSubmit((data) =>
              mutate({
                flowId,
                displayName: data.displayName,
              }),
            )}
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
                    defaultValue={flowName}
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
            <Button loading={isPending}>{t('Confirm')}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { RenameFlowDialog };
