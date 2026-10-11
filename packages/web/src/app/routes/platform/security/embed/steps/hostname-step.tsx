import {
  EmbedSubdomain,
  GenerateEmbedSubdomainRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ConfirmDialog, useAdminAction } from '@/app/components/admin';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  embedSubdomainApi,
  embedSubdomainKeys,
} from '@/features/platform-admin';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { StepShell } from '../stepper';

export const HostnameStep = ({
  subdomain,
}: {
  subdomain: EmbedSubdomain | undefined;
}) => {
  return (
    <StepShell
      title={t('Enter the embed URL')}
      description={t(
        "Pick the domain you'll embed in your website. It will be visible inside workflows.",
      )}
    >
      {subdomain ? (
        <EmbedHostnameSummary subdomain={subdomain} />
      ) : (
        <EmbedHostnameForm />
      )}
    </StepShell>
  );
};

const EmbedHostnameForm = () => {
  const { mutate, isPending } = useSaveHostname();

  const form = useForm<GenerateEmbedSubdomainRequest>({
    resolver: zodResolver(GenerateEmbedSubdomainRequest),
    defaultValues: { hostname: '' },
    mode: 'onChange',
  });

  const handleSubmit = (values: GenerateEmbedSubdomainRequest) => {
    form.clearErrors('root.serverError');
    mutate(values, {
      onError: (error) => {
        form.setError('root.serverError', {
          type: 'manual',
          message: mutationFeedback.message(error),
        });
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-3"
      >
        <FormField
          name="hostname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Domain')}</FormLabel>
              <Input {...field} placeholder="flows.acme.com" />
              <p className="text-xs text-gray-11">
                {t('Use a subdomain you control, like flows.acme.com')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-danger-11">
            {form.formState.errors.root.serverError.message}
          </p>
        )}
        <div className="flex justify-end mt-6">
          <Button
            {...adminControl(AdminControl.EMBEDDING_HOSTNAME_SUBMIT)}
            type="submit"
            size="sm"
            loading={isPending}
          >
            {t('Save domain')}
          </Button>
        </div>
      </form>
    </Form>
  );
};

const EmbedHostnameSummary = ({ subdomain }: { subdomain: EmbedSubdomain }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync, isPending } = useSaveHostname();

  const form = useForm<GenerateEmbedSubdomainRequest>({
    resolver: zodResolver(GenerateEmbedSubdomainRequest),
    defaultValues: { hostname: subdomain.hostname },
    mode: 'onChange',
  });

  const hostnameValue = form.watch('hostname');
  const isDirty = hostnameValue.trim() !== subdomain.hostname;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await mutateAsync({ hostname: hostnameValue.trim() });
    } catch (error) {
      setErrorMessage(mutationFeedback.message(error));
      setConfirmOpen(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => setConfirmOpen(true))}
        className="flex flex-col gap-3"
      >
        <FormField
          name="hostname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Domain')}</FormLabel>
              <Input {...field} placeholder="flows.acme.com" />
              <p className="text-xs text-gray-11">
                {t('Use a subdomain you control, like flows.acme.com')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMessage && (
          <p className="text-sm text-danger-11">{errorMessage}</p>
        )}
        <div className="flex justify-end mt-6">
          <Button
            {...adminControl(AdminControl.EMBEDDING_HOSTNAME_UPDATE_OPEN)}
            type="submit"
            size="sm"
            disabled={!isDirty}
            loading={isPending}
          >
            {t('Update')}
          </Button>
        </div>
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t('Change embed domain?')}
          description={t(
            "Your current domain will stop working and you'll need to add new DNS records to verify the new one. Allowed websites and signing keys will be kept.",
          )}
          consequence={t('This action cannot be undone.')}
          confirmLabel={t('Update domain')}
          onConfirm={handleConfirm}
          controlId={AdminControl.EMBEDDING_HOSTNAME_UPDATE_CONFIRM}
        />
      </form>
    </Form>
  );
};

function useSaveHostname() {
  return useAdminAction<GenerateEmbedSubdomainRequest, EmbedSubdomain>({
    verb: 'save',
    name: '',
    run: (request) => embedSubdomainApi.upsert(request),
    invalidate: [embedSubdomainKeys.current],
    feedback: 'inline',
  });
}
