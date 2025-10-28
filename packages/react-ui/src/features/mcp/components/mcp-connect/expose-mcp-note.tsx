import { t } from 'i18next';
import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId } from '@activepieces/shared';

import { mcpConnectUtils } from './mcp-connect-utils';

export const ExposeMcpNote = () => {
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const hasBeenReplacedWithLocalhost =
    mcpConnectUtils.replaceIpWithLocalhost(publicUrl ?? '') !== publicUrl;
  if (!hasBeenReplacedWithLocalhost) {
    return null;
  }

  return (
    <Alert className="mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <strong>{t('Note')}: </strong>
        {t(
          'If you would like to expose your MCP server to the internet, please set the AP_FRONTEND_URL environment variable to the public URL of your Activepieces instance.',
        )}
      </AlertDescription>
    </Alert>
  );
};
