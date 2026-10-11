import {
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { adminLayout, useAdminAction } from '@/app/components/admin';
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
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

type AllowedDomainDialogProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};

const AllowedDomainsFormValues = z.object({
  allowedAuthDomains: z.array(
    z.object({
      domain: z.string().min(1),
    }),
  ),
});
type AllowedDomainsFormValues = z.infer<typeof AllowedDomainsFormValues>;

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
    resolver: zodResolver(AllowedDomainsFormValues),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'allowedAuthDomains',
  });

  const { mutate, isPending } = useAdminAction<UpdatePlatformRequestBody>({
    verb: 'save',
    name: '',
    run: async (request) => {
      await platformApi.update(request, platform.id);
      await refetch();
    },
    feedback: 'inline',
    onSuccess: () => setOpen(false),
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
          {...adminControl(AdminControl.SSO_ALLOWED_DOMAINS_OPEN)}
          size={'sm'}
          variant={'basic'}
          onClick={() => setOpen(true)}
        >
          {platform.allowedAuthDomains.length > 0 ? t('Update') : t('Enable')}
        </Button>
      </DialogTrigger>
      <DialogContent className={adminLayout.dialog.md}>
        <DialogHeader>
          <DialogTitle>{t('Configure Allowed Domains')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((data) => {
              const domains = [
                ...new Set(
                  data.allowedAuthDomains.map((d) =>
                    d.domain.trim().toLowerCase(),
                  ),
                ),
              ];
              form.clearErrors('root.serverError');
              mutate(
                {
                  allowedAuthDomains: domains,
                  enforceAllowedAuthDomains: domains.length > 0,
                },
                {
                  onError: (error) =>
                    form.setError('root.serverError', {
                      type: 'manual',
                      message: mutationFeedback.message(error),
                    }),
                },
              );
            })}
          >
            <p className="text-sm text-gray-11">
              {t(
                'Enter the allowed domains for the users to authenticate with. An empty list will allow all domains.',
              )}
            </p>
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                name={`allowedAuthDomains.${index}.domain`}
                render={({ field }) => (
                  <FormItem className="space-y-0">
                    <div className="flex gap-2">
                      <Input
                        {...field}
                        id={`allowedAuthDomains.${index}`}
                        placeholder={t('example.com')}
                      />
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="outline"
                        size="icon"
                        aria-label={t('Remove')}
                      >
                        <X />
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
              <Plus />
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
                {...adminControl(AdminControl.SSO_ALLOWED_DOMAINS_SUBMIT)}
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
