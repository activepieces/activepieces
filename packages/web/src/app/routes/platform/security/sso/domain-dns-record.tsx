import { EmailDomainWithUsage } from '@activepieces/shared';
import { t } from 'i18next';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Label } from '@/components/ui/label';
import { AdminControl } from '@/lib/admin-control';

export const DomainDnsRecord = ({
  emailDomain,
}: {
  emailDomain: EmailDomainWithUsage;
}) => (
  <div className="flex flex-col gap-4">
    <div className="flex min-w-0 flex-col gap-2">
      <Label>{t('Name')}</Label>
      <CopyToClipboardInput
        textToCopy={emailDomain.verificationRecordName}
        useInput={true}
        controlId={AdminControl.SSO_SAML_DNS_NAME_COPY}
      />
    </div>
    <div
      className="flex min-w-0 flex-col gap-2"
      data-testid="sso-domain-txt-value"
    >
      <Label>{t('Value')}</Label>
      <CopyToClipboardInput
        textToCopy={emailDomain.verificationRecordValue}
        useInput={true}
        controlId={AdminControl.SSO_SAML_DNS_VALUE_COPY}
      />
    </div>
  </div>
);
