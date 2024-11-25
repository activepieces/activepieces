import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { X } from 'lucide-react';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformApi } from '@/lib/platforms-api';
import { Platform, UpdatePlatformRequestBody } from '@activepieces/shared';

type AllowedDomainDialogProps = {
  platform: Platform;
  refetch: () => Promise<void>;
};

const AllowedDomainsFormValues = Type.Object({
  allowedAuthDomains: Type.Array(
    Type.Object({
      domain: Type.String({
        minLength: 1,
      }),
    }),
  ),
});
type AllowedDomainsFormValues = Static<typeof AllowedDomainsFormValues>;

export const AllowedDomainDialog = ({
  platform,
  refetch,
}: AllowedDomainDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<AllowedDomainsFormValues>({
    defaultValues: {
      allowedAuthDomains: (platform?.allowedAuthDomains ?? []).map(
        (domain) => ({
          domain,
        }),
      ),
    },
    resolver: typeboxResolver(AllowedDomainsFormValues),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'allowedAuthDomains',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, platform.id);
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Allowed domains updated'),
        duration: 3000,
      });
      setOpen(false);
    },
    onError: (error) => {
      console.error(error);
      toast(INTERNAL_ERROR_TOAST);
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
          size={'sm'}
          className="w-32"
          variant={'basic'}
          onClick={() => setOpen(true)}
        >
          {platform.allowedAuthDomains.length > 0 ? t('Update') : t('Enable')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Configure Allowed Domains')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit((data) => {
              mutate({
                allowedAuthDomains: data.allowedAuthDomains.map(
                  (d) => d.domain,
                ),
                enforceAllowedAuthDomains:
                  data.allowedAuthDomains.length === 0 ? false : true,
              });
            })}
          >
            <div className="flex flex-col gap-1">
              <div className="text-muted-foreground text-sm">
                {t(
                  'Enter the allowed domains for the users to authenticate with, Empty list will allow all domains.',
                )}
              </div>
            </div>
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                name={`allowedAuthDomains.${index}.domain`}
                render={({ field }) => (
                  <FormItem className="grid space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        {...field}
                        id={`allowedAuthDomains.${index}`}
                        className="rounded-sm"
                      />
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="outline"
                        size="sm"
                        className="h-10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </FormItem>
                )}
              />
            ))}
            <Button
              type="button"
              onClick={() => append({ domain: '' })}
              variant="outline"
              size="sm"
            >
              {t('Add Domain')}
            </Button>
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                type="button"
              >
                {t('Cancel')}
              </Button>
              <Button
                loading={isPending}
                disabled={!form.formState.isValid}
                type="submit"
              >
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
