import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { agentsApi } from './agents-api';
import { McpToolsIcon } from '../mcp-servers/mcp-tools-icon';

interface AgentToolsIconProps {
    agentId: string;
}

export const AgentToolsIcon = ({ agentId }: AgentToolsIconProps) => {
    const { data: agent, isLoading, error } = useQuery({
        queryKey: ['agent', agentId],
        queryFn: () => agentsApi.get(agentId),
        enabled: !!agentId,
    });

    if (isLoading || !agent) {
        return <div className="text-left"></div>;
    }

    if (error) {
        return <div className="text-left text-muted-foreground">{t('Error loading agent')}</div>;
    }

    if (!agent.mcpId) {
        return <div className="text-left text-muted-foreground">{t('No tools configured')}</div>;
    }

    return (
        <div className="flex items-center gap-2 justify-start w-full">
            <McpToolsIcon mcpId={agent.mcpId} size="xs" square={true} />
        </div>
    );
};