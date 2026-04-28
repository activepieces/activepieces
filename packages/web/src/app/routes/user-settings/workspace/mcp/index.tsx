import { t } from 'i18next';

import { McpServerSettings } from '@/app/components/project-settings/mcp-server';
import { Separator } from '@/components/ui/separator';

export default function WorkspaceMcpPage() {
  return (
    <div className="max-w-xl px-8 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-base font-semibold">{t('MCP Server')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('Connect AI assistants to your workspace via MCP.')}
        </p>
      </div>

      <Separator />

      <McpServerSettings />
    </div>
  );
}
