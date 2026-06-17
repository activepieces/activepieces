import {
  EmbedSubdomain,
  EmbedSubdomainStatus,
  EmbedVerificationRecord,
  EmbedVerificationRecordPurpose,
} from '@activepieces/shared';
import { t } from 'i18next';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Label } from '@/components/ui/label';

import { StepShell } from '../stepper';

export const DnsStep = ({
  subdomain,
}: {
  subdomain: EmbedSubdomain | undefined;
}) => {
  return (
    <StepShell
      title={t('Verify the DNS records')}
      description={t(
        "Add these records at your DNS provider. We'll detect them automatically — this usually takes a few minutes.",
      )}
    >
      {subdomain && (
        <div className="flex flex-col gap-4">
          <EmbedStatusBadge status={subdomain.status} />
          {subdomain.status === EmbedSubdomainStatus.PENDING_VERIFICATION && (
            <VerificationInstructions records={subdomain.verificationRecords} />
          )}
        </div>
      )}
    </StepShell>
  );
};

const EmbedStatusBadge = ({ status }: { status: EmbedSubdomainStatus }) => {
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
};

const VerificationInstructions = ({
  records,
}: {
  records: EmbedVerificationRecord[];
}) => {
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
};

const VerificationRow = ({ record }: { record: EmbedVerificationRecord }) => {
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
};

const PURPOSE_LABELS: Record<EmbedVerificationRecordPurpose, string> = {
  [EmbedVerificationRecordPurpose.HOSTNAME]: 'embedPurposeHostname',
  [EmbedVerificationRecordPurpose.OWNERSHIP]: 'embedPurposeOwnership',
  [EmbedVerificationRecordPurpose.SSL]: 'embedPurposeSsl',
};
