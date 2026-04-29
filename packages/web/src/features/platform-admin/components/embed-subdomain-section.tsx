import {
  EmbedSubdomain,
  EmbedSubdomainStatus,
  EmbedVerificationRecord,
  EmbedVerificationRecordPurpose,
  GenerateEmbedSubdomainRequest,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { TagInput } from '@/components/custom/tag-input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { internalErrorToast } from '@/components/ui/sonner';

import { embedSubdomainMutations } from '../hooks/embed-subdomain-hooks';

export function EmbedHostnameForm() {
  const { mutate, isPending } = embedSubdomainMutations.useUpsert();

  const form = useForm<GenerateEmbedSubdomainRequest>({
    resolver: zodResolver(GenerateEmbedSubdomainRequest),
    defaultValues: { hostname: '' },
    mode: 'onChange',
  });

  const handleSubmit = (values: GenerateEmbedSubdomainRequest) => {
    form.clearErrors('root.serverError');
    mutate(values, {
      onSuccess: () => {
        toast.success(t('Domain saved'));
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : t("Couldn't save domain");
        form.setError('root.serverError', {
          type: 'manual',
          message,
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
              <p className="text-xs text-muted-foreground">
                {t('Use a subdomain you control, like flows.acme.com')}
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root?.serverError && (
          <p className="text-sm text-destructive">
            {form.formState.errors.root.serverError.message}
          </p>
        )}
        <div className="flex justify-end mt-6">
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
            {t('Save domain')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function EmbedHostnameSummary({
  subdomain,
}: {
  subdomain: EmbedSubdomain;
}) {
  const [hostname, setHostname] = useState(subdomain.hostname);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { mutateAsync, isPending } = embedSubdomainMutations.useUpsert();
  const isDirty = hostname.trim() !== subdomain.hostname;

  const handleConfirm = async () => {
    setErrorMessage(null);
    try {
      await mutateAsync({ hostname: hostname.trim() });
      toast.success(t('Domain updated'));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("Couldn't update domain");
      setErrorMessage(message);
      throw error;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label>{t('Domain')}</Label>
        <Input
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="flows.acme.com"
        />
        <p className="text-xs text-muted-foreground">
          {t('Use a subdomain you control, like flows.acme.com')}
        </p>
      </div>
      {errorMessage && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
      <div className="flex justify-end mt-6">
        <Button
          type="button"
          size="sm"
          disabled={!isDirty || isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
          {t('Update')}
        </Button>
      </div>
      <ConfirmationDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('Change embed domain?')}
        message={t(
          "Your current domain will stop working and you'll need to add new DNS records to verify the new one. Allowed websites and signing keys will be kept.",
        )}
        warning={t('This action cannot be undone.')}
        buttonText={t('Update domain')}
        entityName={t('domain')}
        mutationFn={handleConfirm}
      />
    </div>
  );
}

export function EmbedVerificationStep({
  subdomain,
}: {
  subdomain: EmbedSubdomain;
}) {
  return (
    <div className="flex flex-col gap-4">
      <EmbedStatusBadge status={subdomain.status} />
      {subdomain.status === EmbedSubdomainStatus.PENDING_VERIFICATION && (
        <VerificationInstructions records={subdomain.verificationRecords} />
      )}
    </div>
  );
}

export function EmbedAllowedDomainsEditor({
  subdomain,
}: {
  subdomain: EmbedSubdomain;
}) {
  const [domains, setDomains] = useState<readonly string[]>(
    subdomain.allowedEmbedDomains,
  );
  const { mutate, isPending } =
    embedSubdomainMutations.useUpdateAllowedDomains();

  const handleSave = () => {
    mutate(
      { allowedEmbedDomains: [...domains] },
      {
        onSuccess: () => {
          toast.success(t('Allowed domains updated'));
        },
        onError: () => internalErrorToast(),
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('Allowed websites')}</Label>
      <p className="text-xs text-muted-foreground">
        {t(
          'Press Enter or use a comma to add another, e.g. https://app.acme.com',
        )}
      </p>
      <TagInput
        value={domains}
        onChange={setDomains}
        placeholder="https://app.acme.com"
      />
      <div className="flex justify-end mt-6">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isPending}
          type="button"
        >
          {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
          {t('Save')}
        </Button>
      </div>
    </div>
  );
}

function EmbedStatusBadge({ status }: { status: EmbedSubdomainStatus }) {
  switch (status) {
    case EmbedSubdomainStatus.ACTIVE:
      return (
        <div className="flex items-center gap-2 text-sm text-success-600">
          <CheckCircle className="size-4" />
          {t('DNS verified — your domain is ready')}
        </div>
      );
    case EmbedSubdomainStatus.PENDING_VERIFICATION:
      return (
        <div className="flex items-center gap-2 text-sm text-warning">
          <Loader2 className="size-4 animate-spin" />
          {t('Waiting for DNS')}
        </div>
      );
    case EmbedSubdomainStatus.FAILED:
      return (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle className="size-4" />
          {t('Verification failed. Contact support to retry.')}
        </div>
      );
  }
}

const PURPOSE_LABELS: Record<EmbedVerificationRecordPurpose, string> = {
  [EmbedVerificationRecordPurpose.HOSTNAME]: 'embedPurposeHostname',
  [EmbedVerificationRecordPurpose.OWNERSHIP]: 'embedPurposeOwnership',
  [EmbedVerificationRecordPurpose.SSL]: 'embedPurposeSsl',
};

function VerificationInstructions({
  records,
}: {
  records: EmbedVerificationRecord[];
}) {
  return (
    <div className="flex flex-col gap-6 rounded-md border p-4">
      {records.map((record, index) => (
        <VerificationRow
          key={`${record.type}-${record.name}-${index}`}
          record={record}
        />
      ))}
    </div>
  );
}

function VerificationRow({ record }: { record: EmbedVerificationRecord }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
          {record.type}
        </span>
        <span className="text-xs text-muted-foreground">
          {t(PURPOSE_LABELS[record.purpose])}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5 min-w-0">
          <Label className="text-xs text-muted-foreground">{t('Name')}</Label>
          <CopyToClipboardInput textToCopy={record.name} useInput={true} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <Label className="text-xs text-muted-foreground">{t('Value')}</Label>
          <CopyToClipboardInput textToCopy={record.value} useInput={true} />
        </div>
      </div>
    </div>
  );
}
