import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField, FormItem, Form, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { alertsApi } from '@/features/alerts/lib/alerts-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import { Alert, AlertChannel } from '@activepieces/ee-shared';

const FormSchema = Type.Object({
  email: Type.String({
    errorMessage: 'Please enter a valid email address',
    pattern: formatUtils.EMAIL_REGEX,
  }),
});

type FormSchema = Static<typeof FormSchema>;

type AddAlertEmailDialogProps = {
  onAdd: (alert: Alert) => void;
};
const AddAlertEmailDialog = React.memo(
  ({ onAdd }: AddAlertEmailDialogProps) => {
    const [open, setOpen] = useState(false);

    const form = useForm<FormSchema>({
      resolver: typeboxResolver(FormSchema),
      defaultValues: {},
    });

    const { mutate, isPending } = useMutation<Alert, Error, { email: string }>({
      mutationFn: async (params) =>
        alertsApi.create({
          receiver: params.email,
          projectId: authenticationSession.getProjectId(),
          channel: AlertChannel.EMAIL,
        }),
      onSuccess: (data) => {
        onAdd(data);
        toast({
          title: 'Success',
          description: 'Your changes have been saved.',
          duration: 3000,
        });
        setOpen(false);
      },
      onError: (error) => {
        if (api.isError(error)) {
          switch (error.response?.status) {
            case HttpStatusCode.Conflict: {
              form.setError('root.serverError', {
                message: 'The email is already added.',
              });
              break;
            }
            default: {
              console.log(error);
              toast(INTERNAL_ERROR_TOAST);
              break;
            }
          }
        }
        setOpen(true);
      },
    });

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-4 flex items-center space-x-2"
          >
            <Plus className="size-4" />
            <span>Add email</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Alert Email</DialogTitle>
            <DialogDescription>
              Enter the email address to receive alerts.
            </DialogDescription>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(
                  (data) => mutate(data),
                  () => {
                    setOpen(true);
                  },
                )}
                className="gap- grid"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid gap-3">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        {...field}
                        id="email"
                        type="text"
                        placeholder="gilfoyle@piedpiper.com"
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
                <DialogFooter>
                  <Button type="submit" loading={isPending}>
                    Add Email
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  },
);
AddAlertEmailDialog.displayName = 'AddAlertEmailDialog';
export { AddAlertEmailDialog };
