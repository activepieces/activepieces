import { ReloadIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { ButtonWithTooltip } from '@/components/custom/button-with-tooltip';
import { useToast } from '@/components/ui/use-toast';

import { mcpConnectUtils } from './mcp-connect-utils';

interface McpServerUrlBoxProps {
  mcpServerUrl: string;
  onRotateToken: () => void;
  isRotating: boolean;
  hasValidMcp: boolean;
  hasPermissionToWriteMcp: boolean;
}

export const McpServerUrlBox = ({
  mcpServerUrl,
  onRotateToken,
  isRotating,
  hasValidMcp,
  hasPermissionToWriteMcp,
}: McpServerUrlBoxProps) => {
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();
  const toggleTokenVisibility = () => setShowToken(!showToken);

  const maskedServerUrl = showToken
    ? mcpServerUrl
    : mcpConnectUtils.maskToken(mcpServerUrl);

  return (
    <div className="space-y-3">
      <h3 className="text-lg text-foreground font-semibold">
        {t('Server URL')}
      </h3>

      <div className="flex items-center gap-2">
        <div className="font-mono bg-muted/50 border rounded-lg px-3 py-2 text-sm flex-1 overflow-x-auto">
          {maskedServerUrl}
        </div>
        <div className="flex items-center gap-1">
          <ButtonWithTooltip
            tooltip={showToken ? t('Hide') : t('Show')}
            onClick={toggleTokenVisibility}
            variant="outline"
            className="h-8 w-8"
            icon={
              showToken ? (
                <EyeOff className="h-3 w-3" />
              ) : (
                <Eye className="h-3 w-3" />
              )
            }
          />
          <ButtonWithTooltip
            tooltip={t('Rotate')}
            onClick={onRotateToken}
            variant="outline"
            className="h-8 w-8"
            disabled={isRotating || !hasValidMcp}
            hasPermission={hasPermissionToWriteMcp}
            icon={
              isRotating ? (
                <ReloadIcon className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )
            }
          />
          <ButtonWithTooltip
            tooltip={t('Copy')}
            onClick={() => {
              navigator.clipboard.writeText(mcpServerUrl);
              toast({
                description: t('Copied'),
                duration: 2000,
              });
            }}
            variant="outline"
            className="h-8 w-8"
            icon={<Copy className="h-3 w-3" />}
          />
        </div>
      </div>
    </div>
  );
};
