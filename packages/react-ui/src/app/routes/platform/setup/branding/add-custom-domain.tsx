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
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { customDomainApi } from '@/features/platform-admin-panel/lib/custom-domain-api';
import { api } from '@/lib/api';
import { CustomDomain } from '@activepieces/ee-shared';

const FormSchema = Type.Object({
  domain: Type.String({
    errorMessage: t('Please enter a valid domain'),
  }),
});

type AddCustomDomainDialogProps = {
  onAdd: (domain: CustomDomain) => void;
};

const AddCustomDomainDialog = React.memo(
  ({ onAdd }: AddCustomDomainDialogProps) => {
    const [open, setOpen] = useState(false);

    const form = useForm<Static<typeof FormSchema>>({
      resolver: typeboxResolver(FormSchema),
      defaultValues: {},
    });

    const { mutate, isPending } = useMutation<
      CustomDomain,
      Error,
      { domain: string }
    >({
      mutationFn: async (params) => {
        const response = await customDomainApi.create({
          domain: params.domain,
        });
        return response;
      },
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
                message: t('The domain is already added.'),
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
      <Dialog
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            form.reset();
          }
          setOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="mt-4 flex items-center space-x-2"
          >
            <Plus className="size-4" />
            <span>{t('Add Domain')}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t('Add Custom Domain')}</DialogTitle>
            <DialogDescription>
              {t('Enter a domain name without a protocol (e.g. example.com)')}
            </DialogDescription>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => mutate(data))}
                className="gap- grid"
              >
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem className="grid gap-3">
                      <Input
                        {...field}
                        id="domain"
                        type="text"
                        placeholder="example.com"
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
                    {t('Add Domain')}
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

AddCustomDomainDialog.displayName = 'AddCustomDomainDialog';
export { AddCustomDomainDialog };
