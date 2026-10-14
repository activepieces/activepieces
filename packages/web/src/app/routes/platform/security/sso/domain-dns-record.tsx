import { SsoDomainVerificationRecord } from '@activepieces/shared';
import { t } from 'i18next';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Label } from '@/components/ui/label';
import { AdminControl } from '@/lib/admin-control';

export const DomainDnsRecord = ({
  record,
}: {
  record: SsoDomainVerificationRecord;
}) => (
  <div className="flex flex-col gap-2 rounded-md border p-4">
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-gray-3">
        {record.type}
      </span>
    </div>
    <div className="grid gap-3">
      <div className="flex flex-col gap-1.5 min-w-0">
        <Label className="text-xs text-gray-11">{t('Name')}</Label>
        <CopyToClipboardInput
          textToCopy={record.name}
          useInput={true}
          controlId={AdminControl.SSO_SAML_DNS_NAME_COPY}
        />
      </div>
      <div className="flex flex-col gap-1.5 min-w-0">
        <Label className="text-xs text-gray-11">{t('Value')}</Label>
        <CopyToClipboardInput
          textToCopy={record.value}
          useInput={true}
          controlId={AdminControl.SSO_SAML_DNS_VALUE_COPY}
        />
      </div>
    </div>
  </div>
);
