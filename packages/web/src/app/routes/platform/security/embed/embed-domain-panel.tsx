import {
  EmbedSubdomain,
  EmbedSubdomainStatus,
  EmbedVerificationRecordPurpose,
  GenerateEmbedSubdomainRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Panel } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { embedSubdomainMutations } from '@/features/platform-admin';
import { api } from '@/lib/api';

export const EmbedDomainPanel = ({ subdomain }: EmbedDomainPanelProps) => {
  return (
    <Panel
      title={t('Your embed domain')}
      description={t(
        'The hostname your embedded builder runs under. Use a subdomain you control, like flows.acme.com.',
      )}
    >
      <HostnameForm subdomain={subdomain} />
      {subdomain?.status === EmbedSubdomainStatus.FAILED && (
        <p className="text-sm text-danger-11">
          {t('Verification failed. Contact support to retry.')}
        </p>
      )}
      {subdomain?.status === EmbedSubdomainStatus.PENDING_VERIFICATION && (
        <div className="flex flex-col gap-3 border-t border-gray-6 pt-4">
          <p className="text-sm text-gray-11">
            {t(
              "Add these records at your DNS provider. We'll detect them automatically — this usually takes a few minutes.",
            )}
          </p>
          {subdomain.verificationRecords.map((record, index) => (
            <div
              key={`${record.type}-${record.name}-${index}`}
              className="flex flex-col gap-3 rounded-xl border border-gray-6 p-3"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {record.type}
                </Badge>
                <span className="text-sm text-gray-11">
                  {t(PURPOSE_LABELS[record.purpose])}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-2">
                  <Label>{t('Name')}</Label>
                  <CopyToClipboardInput
                    textToCopy={record.name}
                    useInput={true}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <Label>{t('Value')}</Label>
                  <CopyToClipboardInput
                    textToCopy={record.value}
                    useInput={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
};

const HostnameForm = ({
  subdomain,
}: {
  subdomain: EmbedSubdomain | undefined;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutateAsync, isPending } = embedSubdomainMutations.useUpsert();
  const form = useForm<GenerateEmbedSubdomainRequest>({
    resolver: zodResolver(GenerateEmbedSubdomainRequest),
    defaultValues: { hostname: subdomain?.hostname ?? '' },
    mode: 'onChange',
  });
  const hostname = form.watch('hostname').trim();
  const isDirty = hostname !== (subdomain?.hostname ?? '');

  const save = async () => {
    form.clearErrors('root.serverError');
    try {
      await mutateAsync({ hostname });
      toast.success(subdomain ? t('Domain updated') : t('Domain saved'));
    } catch (error) {
      form.setError('root.serverError', {
        type: 'manual',
        message: api.extractServerErrorMessage(
          error,
          subdomain ? t("Couldn't update domain") : t("Couldn't save domain"),
        ),
      });
      throw error;
    }
  };

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-2"
        onSubmit={form.handleSubmit(() =>
          subdomain ? setConfirmOpen(true) : save().catch(() => null),
        )}
      >
        <FormField
          name="hostname"
          render={({ field }) => (
            <FormItem>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  {...field}
                  aria-label={t('Domain')}
                  placeholder="flows.acme.com"
                  className="max-w-xs"
                />
                {subdomain && !isDirty && (
                  <StatusDot tone={STATUS_TONE[subdomain.status]}>
                    {t(STATUS_LABEL[subdomain.status])}
                  </StatusDot>
                )}
                {(isDirty || !subdomain) && (
                  <Button
                    type="submit"
                    variant={subdomain ? 'outline' : 'default'}
                    loading={isPending}
                    disabled={!isDirty || !form.formState.isValid}
                  >
                    {subdomain ? t('Change domain') : t('Save domain')}
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-danger-11">
            {form.formState.errors.root.serverError.message}
          </p>
        )}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title={t('Change embed domain?')}
          description={t(
            "Your current domain will stop working and you'll need to add new DNS records to verify the new one. Allowed websites and signing keys will be kept.",
          )}
          consequence={t('This action cannot be undone.')}
          confirmLabel={t('Change domain')}
          onConfirm={save}
        />
      </form>
    </Form>
  );
};

const STATUS_LABEL: Record<EmbedSubdomainStatus, string> = {
  [EmbedSubdomainStatus.ACTIVE]: 'Verified',
  [EmbedSubdomainStatus.PENDING_VERIFICATION]: 'Waiting for DNS',
  [EmbedSubdomainStatus.FAILED]: 'Failed',
};

const STATUS_TONE: Record<
  EmbedSubdomainStatus,
  'success' | 'warning' | 'danger'
> = {
  [EmbedSubdomainStatus.ACTIVE]: 'success',
  [EmbedSubdomainStatus.PENDING_VERIFICATION]: 'warning',
  [EmbedSubdomainStatus.FAILED]: 'danger',
};

const PURPOSE_LABELS: Record<EmbedVerificationRecordPurpose, string> = {
  [EmbedVerificationRecordPurpose.HOSTNAME]: 'embedPurposeHostname',
  [EmbedVerificationRecordPurpose.OWNERSHIP]: 'embedPurposeOwnership',
  [EmbedVerificationRecordPurpose.SSL]: 'embedPurposeSsl',
};

type EmbedDomainPanelProps = {
  subdomain: EmbedSubdomain | undefined;
};
