import { ReloadIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { ButtonWithTooltip } from '@/components/custom/button-with-tooltip';
import { SimpleJsonViewer } from '@/components/simple-json-viewer';
import { useToast } from '@/components/ui/use-toast';

import { McpClientType, mcpConnectUtils } from './mcp-connect-utils';
import { SecurityNote } from './security-note';

export const ConfigDisplay = ({
  mcpServerUrl,
  type,
  onRotateToken,
  isRotating = false,
  hasValidMcp = false,
  hasPermissionToWriteMcp = true,
}: {
  mcpServerUrl: string;
  type: McpClientType;
  onRotateToken: () => void;
  isRotating?: boolean;
  hasValidMcp?: boolean;
  hasPermissionToWriteMcp?: boolean;
}) => {
  const { toast } = useToast();
  const [showToken, setShowToken] = useState(false);

  const toggleTokenVisibility = () => setShowToken(!showToken);
  const maskedUrl = showToken
    ? mcpServerUrl
    : mcpConnectUtils.maskToken(mcpServerUrl);

  const handleCopyConfig = () => {
    const config = mcpConnectUtils.constructConfig(type, mcpServerUrl);
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    toast({
      description: t('Configuration copied to clipboard'),
      duration: 3000,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SecurityNote />
        </div>
        <div className="flex gap-2">
          <ButtonWithTooltip
            tooltip={
              showToken ? t('Hide sensitive data') : t('Show sensitive data')
            }
            onClick={toggleTokenVisibility}
            variant="outline"
            icon={
              showToken ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )
            }
          />
          <ButtonWithTooltip
            tooltip={t('Create a new URL. The current one will stop working.')}
            onClick={onRotateToken}
            variant="outline"
            disabled={isRotating || !hasValidMcp}
            hasPermission={hasPermissionToWriteMcp}
            icon={
              isRotating ? (
                <ReloadIcon className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )
            }
          />
          <ButtonWithTooltip
            tooltip={t('Copy configuration')}
            onClick={handleCopyConfig}
            variant="outline"
            icon={<Copy className="h-4 w-4" />}
          />
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <SimpleJsonViewer
          hideCopyButton={true}
          data={mcpConnectUtils.constructConfig(type, maskedUrl)}
        />
      </div>
    </div>
  );
};
