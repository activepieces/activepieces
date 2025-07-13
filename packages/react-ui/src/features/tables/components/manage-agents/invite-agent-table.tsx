import { t } from 'i18next';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManageAgentDialog } from '../manage-agent-dialog';
import { useMemo } from 'react';
import { Agent } from '@activepieces/shared';
import { AgentsIcons } from './agents-icons';


interface InviteAgentTableProps {
  disabled?: boolean;
}

export function InviteAgentTable({ 
  disabled = false 
}: InviteAgentTableProps) {

    const agents = useMemo<Agent[]>(() => {
        return [];
    }, []);

  return (
    <div className="flex items-center gap-3">
      <AgentsIcons agents={agents} maxVisible={4} />
      <ManageAgentDialog>
        <Button
          variant="secondary"
          disabled={disabled}
          className="flex items-center gap-2"
        >
          <Bot className="h-4 w-4" />
          {t('Manage Agents')}
        </Button>
      </ManageAgentDialog>
    </div>
  );
} 