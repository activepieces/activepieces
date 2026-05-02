import {
  ApErrorParams,
  PlatformWithoutSensitiveData,
  SsoDomainVerification,
  SsoDomainVerificationRecord,
  SsoDomainVerificationStatus,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { samlSsoApi } from '@/features/platform-admin';
import { api } from '@/lib/api';

type SsoDomainDialogProps = {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
};

export const SsoDomainDialog = ({
  platform,
  refetch,
}: SsoDomainDialogProps) => {
  const [open, setOpen] = useState(false);
  const hasDomain = !!platform.ssoDomain;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="basic">
          {hasDomain ? t('Manage') : t('Configure')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {open && (
          <SsoDomainForm
            key={platform.ssoDomain ?? 'unset'}
            platform={platform}
            refetch={refetch}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const SsoDomainFormValues = z.object({
  ssoDomain: z
    .hostname('invalidSsoDomain')
    .max(253, 'invalidSsoDomain')
    .refine((v) => v.includes('.'), 'invalidSsoDomain'),
});
type SsoDomainFormValues = z.infer<typeof SsoDomainFormValues>;

const SsoDomainForm = ({
  platform,
  refetch,
  onClose,
}: {
  platform: PlatformWithoutSensitiveData;
  refetch: () => Promise<void>;
  onClose: () => void;
}) => {
  const verification = platform.ssoDomainVerification ?? null;

  const form = useForm<SsoDomainFormValues>({
    resolver: zodResolver(SsoDomainFormValues),
    defaultValues: { ssoDomain: platform.ssoDomain ?? '' },
    mode: 'onChange',
  });

  const ssoDomainValue = form.watch('ssoDomain');
  const isDirty =
    ssoDomainValue.trim().toLowerCase() !== (platform.ssoDomain ?? '');

  const { mutate: saveDomain, isPending: isSaving } = useMutation({
    mutationFn: async (values: SsoDomainFormValues) => {
      await samlSsoApi.updateSsoDomain(values.ssoDomain.trim().toLowerCase());
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('SSO domain saved'));
    },
    onError: (error) => {
      form.setError('root.serverError', {
        type: 'manual',
        message: extractServerErrorMessage(error, t("Couldn't save domain")),
      });
    },
  });

  const { mutate: verifyDomain, isPending: isVerifying } = useMutation({
    mutationFn: async () => {
      const result = await samlSsoApi.verifySsoDomain();
      await refetch();
      return result;
    },
    onSuccess: (result) => {
      if (
        result.ssoDomainVerification?.status ===
        SsoDomainVerificationStatus.VERIFIED
      ) {
        toast.success(t('Domain verified'));
        onClose();
      } else {
        toast.message(
          t('TXT record not found yet — DNS can take a few minutes.'),
        );
      }
    },
    onError: (error) => {
      toast.error(
        extractServerErrorMessage(error, t("Couldn't verify domain")),
      );
    },
  });

  const { mutate: removeDomain, isPending: isRemoving } = useMutation({
    mutationFn: async () => {
      await samlSsoApi.updateSsoDomain(null);
      await refetch();
    },
    onSuccess: () => {
      toast.success(t('SSO domain removed'));
      onClose();
    },
    onError: (error) => {
      toast.error(
        extractServerErrorMessage(error, t("Couldn't remove domain")),
      );
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('SSO Domain')}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form
          className="grid space-y-4"
          onSubmit={form.handleSubmit((v) => saveDomain(v))}
        >
          <FormField
            name="ssoDomain"
            render={({ field }) => (
              <FormItem className="grid space-y-2">
                <Label htmlFor="ssoDomain">{t('Domain')}</Label>
                <Input
                  {...field}
                  id="ssoDomain"
                  placeholder="acme.com"
                  className="rounded-sm"
                />
                <FormDescription>
                  {t(
                    'When a user enters this domain on the sign-in page, they will be redirected to your SAML identity provider.',
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {verification && !isDirty && (
            <DomainVerificationPanel
              verification={verification}
              isVerifying={isVerifying}
              onVerify={() => verifyDomain()}
            />
          )}

          {form.formState.errors.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}

          <DialogFooter>
            {platform.ssoDomain && (
              <Button
                type="button"
                variant="basic"
                className="text-destructive mr-auto"
                loading={isRemoving}
                onClick={() => removeDomain()}
              >
                {t('Remove domain')}
              </Button>
            )}
            <Button variant="outline" type="button" onClick={onClose}>
              {t('Close')}
            </Button>
            <Button
              type="submit"
              loading={isSaving}
              disabled={!form.formState.isValid || !isDirty}
            >
              {t('Save domain')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

const DomainVerificationPanel = ({
  verification,
  isVerifying,
  onVerify,
}: {
  verification: SsoDomainVerification;
  isVerifying: boolean;
  onVerify: () => void;
}) => {
  const verified = verification.status === SsoDomainVerificationStatus.VERIFIED;
  return (
    <div className="flex flex-col gap-3">
      <VerificationStatusBadge status={verification.status} />
      {!verified && (
        <>
          <p className="text-xs text-muted-foreground">
            {t(
              "Add this TXT record at your DNS provider. We'll detect it once it propagates — this usually takes a few minutes.",
            )}
          </p>
          <VerificationRecordRow record={verification.record} />
          <div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              loading={isVerifying}
              onClick={onVerify}
            >
              {t('Verify DNS')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

const VerificationStatusBadge = ({
  status,
}: {
  status: SsoDomainVerificationStatus;
}) => {
  if (status === SsoDomainVerificationStatus.VERIFIED) {
    return (
      <div className="flex items-center gap-2 text-sm text-success-600">
        <CheckCircle className="size-4" />
        {t('DNS verified — domain is ready')}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-sm text-warning">
      <Loader2 className="size-4 animate-spin" />
      {t('Waiting for DNS')}
    </div>
  );
};

const VerificationRecordRow = ({
  record,
}: {
  record: SsoDomainVerificationRecord;
}) => (
  <div className="flex flex-col gap-2 rounded-md border p-4">
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
        {record.type}
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

function extractServerErrorMessage(error: unknown, fallback: string): string {
  if (api.isError(error)) {
    const data = error.response?.data as ApErrorParams | undefined;
    const message =
      data?.params && 'message' in data.params
        ? data.params.message
        : undefined;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
}
