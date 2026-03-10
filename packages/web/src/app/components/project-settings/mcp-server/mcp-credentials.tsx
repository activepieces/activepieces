import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { flagsHooks } from '@/hooks/flags-hooks';

export function McpCredentials() {
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const baseUrl = publicUrl?.replace(/\/$/, '') ?? '';
  const serverUrl = `${baseUrl}/api/v1/mcp`;

  return (
    <div className="space-y-4">
      {/* Server URL Field */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">
          {t('Server URL')}
        </label>
        <div className="flex items-center gap-2">
          <div className="bg-muted/50 rounded-md px-3 py-2 text-sm flex-1 overflow-x-auto">
            {serverUrl}
          </div>
          <CopyButton textToCopy={serverUrl} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t(
            'This server uses OAuth authentication. Connect your MCP client to this URL to start the OAuth flow.',
          )}
        </p>
      </div>
    </div>
  );
}
