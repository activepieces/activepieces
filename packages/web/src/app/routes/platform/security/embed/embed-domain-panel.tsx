import {
  EmbedSubdomain,
  EmbedSubdomainStatus,
  EmbedVerificationRecordPurpose,
  GenerateEmbedSubdomainRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import * as React from 'react';
import { useState } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { UnsavedChangesGuard } from '@/components/custom/leave-without-saving';
import { Panel } from '@/components/custom/panel';
import { SaveBar } from '@/components/custom/settings-parts';
import { StatusDot } from '@/components/custom/status-dot';
import { Badge } from '@/components/ui/badge';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { embedSubdomainMutations } from '@/features/platform-admin';
import { AdminControl } from '@/lib/admin-control';
import { mutationFeedback } from '@/lib/mutation-feedback';

export function useEmbedDomainEditor({
  subdomain,
}: {
  subdomain: EmbedSubdomain | undefined;
}): EmbedDomainEditor {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const form = useForm<GenerateEmbedSubdomainRequest>({
    resolver: zodResolver(GenerateEmbedSubdomainRequest),
    defaultValues: { hostname: subdomain?.hostname ?? '' },
    mode: 'onChange',
  });
  const { mutateAsync, isPending } = embedSubdomainMutations.useUpsert({
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: mutationFeedback.message(error),
      });
    },
  });
  const hostname = form.watch('hostname').trim();
  const dirty = hostname !== (subdomain?.hostname ?? '');
  const serverError = form.formState.errors.root?.serverError?.message;

  const save = () => {
    form.clearErrors('root.serverError');
    return mutateAsync({
      request: { hostname },
      replacing: subdomain !== undefined,
    });
  };

  const submit = (event?: React.BaseSyntheticEvent) => {
    event?.preventDefault();
    if (isPending || !dirty) {
      return;
    }
    void form.handleSubmit(() => {
      if (subdomain) {
        setConfirmOpen(true);
        return;
      }
      save().catch(() => undefined);
    })();
  };

  const footer =
    dirty || serverError ? (
      <form className="contents" onSubmit={submit}>
        <SaveBar
          dirty={dirty}
          saving={isPending}
          invalid={!form.formState.isValid}
          error={serverError}
          onDiscard={() => form.reset()}
          saveLabel={subdomain ? t('Change domain') : t('Save domain')}
          saveControl={
            subdomain
              ? AdminControl.EMBEDDING_HOSTNAME_UPDATE_OPEN
              : AdminControl.EMBEDDING_HOSTNAME_SUBMIT
          }
        />
      </form>
    ) : null;

  const dialogs = (
    <>
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
        onError={() => setConfirmOpen(false)}
        controlId={AdminControl.EMBEDDING_HOSTNAME_UPDATE_CONFIRM}
      />
      <UnsavedChangesGuard dirty={dirty} />
    </>
  );

  return { form, dirty, submit, footer, dialogs };
}

export const EmbedDomainPanel = ({
  subdomain,
  editor,
}: EmbedDomainPanelProps) => {
  return (
    <Panel
      title={t('Your embed domain')}
      description={t(
        'The hostname your embedded builder runs under. Use a subdomain you control, like flows.acme.com.',
      )}
    >
      <Form {...editor.form}>
        <form className="flex flex-col gap-2" onSubmit={editor.submit}>
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
                  {subdomain && !editor.dirty && (
                    <StatusDot tone={STATUS_TONE[subdomain.status]}>
                      {t(STATUS_LABEL[subdomain.status])}
                    </StatusDot>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
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
                    controlId={AdminControl.EMBEDDING_DNS_NAME_COPY}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <Label>{t('Value')}</Label>
                  <CopyToClipboardInput
                    textToCopy={record.value}
                    useInput={true}
                    controlId={AdminControl.EMBEDDING_DNS_VALUE_COPY}
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
  editor: EmbedDomainEditor;
};

export type EmbedDomainEditor = {
  form: UseFormReturn<GenerateEmbedSubdomainRequest>;
  dirty: boolean;
  submit: (event?: React.BaseSyntheticEvent) => void;
  footer: React.ReactNode;
  dialogs: React.ReactNode;
};
