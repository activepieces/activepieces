import { ReloadIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import {
  Copy,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Link,
  RefreshCw,
} from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip';
import { useToast } from '../../components/ui/use-toast';

interface McpUrlProps {
  serverUrl: string;
  onRotateToken: () => void;
  isRotating: boolean;
  hasValidMcp: boolean;
}

export const McpUrl = ({
  serverUrl,
  onRotateToken,
  isRotating,
  hasValidMcp,
}: McpUrlProps) => {
  const [showToken, setShowToken] = useState(false);
  const { toast } = useToast();

  const toggleTokenVisibility = () => {
    setShowToken(!showToken);
  };

  const maskedServerUrl = showToken
    ? serverUrl
    : serverUrl.replace(/\/([^/]+)\/sse$/, '/••••••••••••••••••••••/sse');

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center gap-2 mb-1">
        <Link className="h-5 w-5 text-primary" />
        <Label className="text-lg font-medium">{t('Server URL')}</Label>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="font-mono bg-muted/30 text-foreground/90 cursor-text w-full border rounded-md px-3 py-2.5 text-sm overflow-x-auto">
            {maskedServerUrl}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={toggleTokenVisibility}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {showToken
                      ? t('Hide the token for security')
                      : t('Show the token')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-amber-500"
                    onClick={onRotateToken}
                    disabled={isRotating || !hasValidMcp}
                  >
                    {isRotating ? (
                      <ReloadIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t(
                      'Generate a new token for security. This will invalidate the current URL.',
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-blue-500"
                    onClick={() => {
                      navigator.clipboard.writeText(serverUrl);
                      toast({
                        description: t('URL copied to clipboard'),
                        duration: 3000,
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('Copy URL to clipboard')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-1">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            {t(
              'This URL contains a sensitive security token. Only share it with trusted applications and services. Rotate the token if you suspect it has been compromised.',
            )}
          </p>
        </div>
        <Alert variant="warning" className="mt-2">
          <RefreshCw className="h-4 w-4" />
          <AlertDescription>
            {t(
              'After making any changes to connections or flows, you will need to reconnect your MCP server for the changes to take effect.',
            )}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};
