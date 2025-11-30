import { ReloadIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { ButtonWithTooltip } from '@/components/custom/button-with-tooltip';
import { useToast } from '@/components/ui/use-toast';
import { mcpHooks } from './utils/mcp-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, Permission, PopulatedMcpServer } from '@activepieces/shared';
import { useAuthorization } from '@/hooks/authorization-hooks';

export function McpCredentials({ mcpServer }: McpCredentialsProps) {
    const { toast } = useToast();
    const [showToken, setShowToken] = useState(false);
    const toggleTokenVisibility = () => setShowToken(!showToken);
    const currentProjectId = authenticationSession.getProjectId();

    const { checkAccess } = useAuthorization();
    const { mutate: rotateToken, isPending: isRotating } = mcpHooks.useRotateMcpToken(currentProjectId!);

    const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
    const serverUrl = `${publicUrl}v1/projects/${currentProjectId}/mcp-server/http`;

    const maskToken = (tokenValue: string) => {
        if (tokenValue.length <= 8) return '••••••••';
        return '••••••••' + tokenValue.slice(-4);
    };

    const handleCopy = (value: string, label: string) => {
        navigator.clipboard.writeText(value);
        toast({
            description: t('{{label}} copied to clipboard', { label }),
            duration: 3000,
        });
    };

    return (
        <div className="space-y-4">
            {/* Base URL Field */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">{t('Server URL')}</label>
                <div className="flex items-center gap-2">
                    <div className="bg-muted/50 border rounded-md px-3 py-1 text-sm flex-1 overflow-x-auto">
                        {serverUrl}
                    </div>
                    <ButtonWithTooltip
                        tooltip={t('Copy')}
                        onClick={() => handleCopy(serverUrl, t('Server URL'))}
                        variant="outline"
                        icon={<Copy className="h-4 w-4" />}
                    />
                </div>
            </div>

            {/* Token Field */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">{t('Token')}</label>
                <div className="flex items-center gap-2">
                    <div className="bg-muted/50 border rounded-md px-3 py-1 text-sm flex-1 overflow-x-auto">
                        {showToken ? mcpServer?.token : maskToken(mcpServer?.token ?? '')}
                    </div>
                    <ButtonWithTooltip
                        tooltip={showToken ? t('Hide sensitive data') : t('Show sensitive data')}
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
                        tooltip={t('Create a new token. The current one will stop working.')}
                        onClick={() => rotateToken()}
                        variant="outline"
                        disabled={isRotating || !mcpServer?.status}
                        hasPermission={ checkAccess(Permission.WRITE_MCP) }
                        icon={
                            isRotating ? (
                                <ReloadIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )
                        }
                    />
                    <ButtonWithTooltip
                        tooltip={t('Copy')}
                        onClick={() => handleCopy(mcpServer?.token ?? '', t('Token'))}
                        variant="outline"
                        icon={<Copy className="h-4 w-4" />}
                    />
                </div>
            </div>
        </div>
    );
}


type McpCredentialsProps = {
    mcpServer: PopulatedMcpServer;
}
