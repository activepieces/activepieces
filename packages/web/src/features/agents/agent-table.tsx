import { AgentSummary, AgentVisibility } from '@activepieces/shared';
import { t } from 'i18next';
import { Lock } from 'lucide-react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { AgentActionsMenu } from './agent-actions-menu';
import { AgentMark } from './agent-mark';
import { AgentToolStack } from './agent-tool-stack';

const PRIVATE_DOT_COLOR = '#A3A3A3';

export const AgentTable = ({
  agents,
  projectDotColorFor,
  onOpen,
}: AgentTableProps) => (
  <div className="overflow-x-auto rounded-[10px] border border-border">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{t('Agent')}</TableHead>
          <TableHead className="hidden md:table-cell">
            {t('Description')}
          </TableHead>
          <TableHead className="hidden lg:table-cell">{t('Tools')}</TableHead>
          <TableHead>{t('Project')}</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {agents.map((agent) => (
          <TableRow
            key={agent.id}
            className="cursor-pointer"
            onClick={() => onOpen(agent)}
          >
            <TableCell>
              <div className="flex min-w-0 items-center gap-3">
                <AgentMark size="sm" icon={agent.icon} color={agent.color} />
                <span className="flex min-w-0 items-center gap-1.5">
                  <TextWithTooltip tooltipMessage={agent.displayName}>
                    <span className="truncate text-sm font-medium">
                      {agent.displayName}
                    </span>
                  </TextWithTooltip>
                  {agent.visibility === AgentVisibility.RESTRICTED && (
                    <Lock
                      size={12}
                      className="shrink-0 text-muted-foreground"
                      aria-label={t(
                        'Only you and the people you shared it with',
                      )}
                    />
                  )}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden max-w-[420px] md:table-cell">
              <TextWithTooltip
                tooltipMessage={agent.description ?? t('No description yet')}
              >
                <span className="block truncate text-muted-foreground">
                  {agent.description ?? t('No description yet')}
                </span>
              </TextWithTooltip>
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <AgentToolStack
                toolCount={agent.toolCount}
                toolPieceNames={agent.toolPieceNames}
              />
            </TableCell>
            <TableCell>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="size-[7px] shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: agent.projectIsPrivate
                      ? PRIVATE_DOT_COLOR
                      : projectDotColorFor(agent),
                  }}
                />
                {agent.projectIsPrivate
                  ? t('Personal Project')
                  : agent.projectDisplayName}
              </span>
            </TableCell>
            <TableCell onClick={(event) => event.stopPropagation()}>
              <AgentActionsMenu agent={agent} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

type AgentTableProps = {
  agents: AgentSummary[];
  projectDotColorFor: (agent: AgentSummary) => string | undefined;
  onOpen: (agent: AgentSummary) => void;
};
