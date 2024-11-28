import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { alertsApi } from '@/features/alerts/lib/alerts-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import { Alert, AlertChannel } from '@activepieces/ee-shared';
import { Permission } from '@activepieces/shared';

const FormSchema = Type.Object({
  email: Type.String({
    errorMessage: t('Please enter a valid email address'),
    pattern: formatUtils.emailRegex.source,
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
    const { checkAccess } = useAuthorization();
    const writeAlertPermission = checkAccess(Permission.WRITE_ALERT);

    const { mutate, isPending } = useMutation<Alert, Error, { email: string }>({
      mutationFn: async (params) =>
        alertsApi.create({
          receiver: params.email,
          projectId: authenticationSession.getProjectId()!,
          channel: AlertChannel.EMAIL,
        }),
      onSuccess: (data) => {
        onAdd(data);
        toast({
          title: t('Success'),
          description: t('Your changes have been saved.'),
          duration: 3000,
        });
        setOpen(false);
      },
      onError: (error) => {
        if (api.isError(error)) {
          switch (error.response?.status) {
            case HttpStatusCode.Conflict: {
              form.setError('root.serverError', {
                message: t('The email is already added.'),
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
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="mt-4 w-full flex items-center space-x-2"
                disabled={writeAlertPermission === false}
              >
                <Plus className="size-4" />
                <span>{t('Add email')}</span>
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          {writeAlertPermission === false && (
            <TooltipContent side="bottom">
              {t('Only project admins can do this')}
            </TooltipContent>
          )}
        </Tooltip>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('Add Alert Email')}</DialogTitle>
            <DialogDescription>
              {t('Enter the email address to receive alerts.')}
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
                      <Label htmlFor="email">{t('Email')}</Label>
                      <Input
                        {...field}
                        id="email"
                        type="text"
                        placeholder="joe@doe.com"
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
                    {t('Add Email')}
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
