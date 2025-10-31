import {
  FlowOperationType,
  FlowAction,
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
} from '@activepieces/shared';
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { Static, Type } from '@sinclair/typebox';
import { t } from 'i18next';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { useBuilderStateContext } from '../../builder-hooks';

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

const RenameStepSchema = Type.Object({
  displayName: Type.String({
    minLength: 1,
    description: 'Step name cannot be empty',
  }),
});

type RenameStepSchema = Static<typeof RenameStepSchema>;

type RenameStepDialogProps = {
  children: React.ReactNode;
  stepName: string;
};

const RenameStepDialog: React.FC<RenameStepDialogProps> = ({
  children,
  stepName,
}) => {
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [flowVersion, applyOperation, setLastRerenderPieceSettingsTimeStamp] =
    useBuilderStateContext((state) => [
      state.flowVersion,
      state.applyOperation,
      state.setLastRerenderPieceSettingsTimeStamp,
    ]);

  const step = flowStructureUtil.getStep(stepName, flowVersion.trigger);

  const form = useForm<RenameStepSchema>({
    resolver: typeboxResolver(RenameStepSchema),
    defaultValues: {
      displayName: step?.displayName || '',
    },
  });

  const handleRename = (data: RenameStepSchema) => {
    if (!step) {
      toast({
        title: t('Error'),
        description: t('Step not found'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const isTrigger =
        'type' in step &&
        Object.values(FlowTriggerType).includes(step.type as FlowTriggerType);

      if (isTrigger) {
        applyOperation({
          type: FlowOperationType.UPDATE_TRIGGER,
          request: {
            ...step,
            displayName: data.displayName,
            valid: step.valid ?? true,
          } as FlowTrigger,
        });
      } else {
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            ...step,
            displayName: data.displayName,
            valid: step.valid ?? true,
          } as FlowAction,
        });
      }

      setLastRerenderPieceSettingsTimeStamp(Date.now());
      setIsRenameDialogOpen(false);
      toast({
        title: t('Success'),
        description: t('Step has been renamed'),
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to rename step:', error);
      toast({
        title: t('Error'),
        description: t('Failed to rename step'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t('Rename')} {step?.displayName || stepName}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit(handleRename)}
          >
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <Label htmlFor="displayName">{t('Name')}</Label>
                  <Input
                    {...field}
                    id="displayName"
                    placeholder={t('Enter step name')}
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <Button type="submit">{t('Confirm')}</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export { RenameStepDialog };
