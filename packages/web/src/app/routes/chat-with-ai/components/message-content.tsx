import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Plus, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Markdown } from '@/components/prompt-kit/markdown';
import { Button } from '@/components/ui/button';
import { appConnectionsQueries } from '@/features/connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import {
  AutomationProposal,
  ConnectionRequired,
  parseAllConnectionsRequired,
  parseAutomationProposal,
  parseMultiQuestion,
  parseQuickReplies,
  stripIncompleteSpecialBlock,
} from '../lib/message-parsers';

import { ProposalFlowDiagram } from './proposal-flow-diagram';

const PROSE_CLASSES =
  'max-w-none break-words text-sm [&_p]:mb-4 [&_p:last-child]:mb-0 [&_table]:mb-4 [&_h1]:text-[18px] [&_h2]:text-[18px] [&_h3]:text-[18px]';

const AUTH_URL_PATTERN = /https?:\/\/[^\s]*\/authorize\?[^\s]*/;

function stripAuthContent(content: string): string {
  return content
    .replace(/https?:\/\/[^\s]*\/authorize\?[^\s]*/g, '')
    .replace(/Please open this URL in your browser to authorize:?\s*/gi, '')
    .replace(/After authorizing.*$/gis, '')
    .replace(/If the browser shows.*$/gis, '')
    .replace(/If you see a connection error.*$/gis, '')
    .replace(/Once you've completed.*$/gis, '')
    .replace(/paste the full URL.*$/gis, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function MessageContentWithAuth({
  content,
  onSend,
}: {
  content: string;
  onSend?: (text: string) => void;
}) {
  const hasAuthUrl = AUTH_URL_PATTERN.test(content);

  const { proposal, connections, finalContent } = useMemo(() => {
    if (hasAuthUrl) {
      return { proposal: null, connections: [], finalContent: '' };
    }
    const { proposal, cleanContent: afterProposal } =
      parseAutomationProposal(content);
    const { connections, cleanContent: afterConnection } =
      parseAllConnectionsRequired(afterProposal);
    const { cleanContent: afterQuestions } =
      parseMultiQuestion(afterConnection);
    const { cleanContent: afterReplies } = parseQuickReplies(afterQuestions);
    const finalContent = stripIncompleteSpecialBlock(afterReplies);
    return { proposal, connections, finalContent };
  }, [content, hasAuthUrl]);

  if (hasAuthUrl) {
    const cleanContent = stripAuthContent(content);

    return (
      <div className="space-y-3">
        {cleanContent && (
          <div className={PROSE_CLASSES}>
            <Markdown>{cleanContent}</Markdown>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-4">
          <Zap className="h-5 w-5 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            {t(
              'Project tools (flows, tables, connections) will be available automatically in a future update.',
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {finalContent && (
        <div className={PROSE_CLASSES}>
          <Markdown>{finalContent}</Markdown>
        </div>
      )}
      {connections.map((conn) => (
        <ConnectionRequiredCard
          key={conn.piece}
          connection={conn}
          onSend={onSend}
        />
      ))}
      {proposal && (
        <AutomationProposalCard
          proposal={proposal}
          onBuild={() =>
            onSend?.(`Yes, build the "${proposal.title}" automation`)
          }
        />
      )}
    </div>
  );
}

export function AutomationProposalCard({
  proposal,
  onBuild,
}: {
  proposal: AutomationProposal;
  onBuild: () => void;
}) {
  return (
    <div className="rounded-xl border bg-background overflow-hidden my-2">
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10 shrink-0">
            <Zap className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{proposal.title}</h3>
            {proposal.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {proposal.description}
              </p>
            )}
          </div>
        </div>

        <div className="ml-12">
          <ProposalFlowDiagram steps={proposal.steps} />
        </div>
      </div>

      {proposal.isComplete && (
        <motion.div
          className="border-t px-4 py-3 bg-muted/30"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Button size="sm" className="gap-1.5" onClick={onBuild}>
            <Zap className="h-3.5 w-3.5" />
            {t('Build this automation')}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export function ConnectionRequiredCard({
  connection,
  onSend,
}: {
  connection: ConnectionRequired;
  onSend?: (text: string) => void;
}) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExternalId, setSelectedExternalId] = useState<string | null>(
    null,
  );
  const shortName = connection.piece.replace(/[^a-z0-9-]/gi, '');
  const pieceName = connection.piece.startsWith('@activepieces/')
    ? connection.piece
    : `@activepieces/piece-${shortName}`;
  const { pieceModel, isLoading: isLoadingPiece } = piecesHooks.usePiece({
    name: pieceName,
  });
  const projectId = authenticationSession.getProjectId();
  const { data: connections, isLoading: isLoadingConnections } =
    appConnectionsQueries.useAppConnections({
      request: {
        pieceName,
        projectId: projectId!,
        limit: 1000,
      },
      pieceAuth: pieceModel?.auth,
      extraKeys: [pieceName, projectId ?? ''],
      enabled: Boolean(projectId) && Boolean(pieceModel),
      staleTime: 0,
    });
  const existing = connections?.data ?? [];
  const hasExisting = existing.length > 0;

  const handleSelectExisting = (externalId: string, displayName: string) => {
    setSelectedExternalId(externalId);
    onSend?.(
      `Using existing ${connection.displayName} account "${displayName}". [auth externalId: ${externalId}]`,
    );
  };

  return (
    <>
      <motion.div
        className="rounded-xl border bg-background overflow-hidden my-2"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          type: 'spring',
          stiffness: 300,
          damping: 25,
        }}
      >
        <div className="p-4 flex items-center gap-3">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{connection.displayName}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasExisting
                ? t(
                    '{count, plural, =1 {1 account already connected} other {# accounts already connected}}',
                    { count: existing.length },
                  )
                : t('This automation needs a {name} connection to work', {
                    name: connection.displayName,
                  })}
            </p>
          </div>
          <Button
            size="sm"
            variant={hasExisting ? 'outline' : 'default'}
            className="gap-1.5 shrink-0"
            disabled={isLoadingPiece || isLoadingConnections}
            onClick={() => setDialogOpen(true)}
          >
            {hasExisting ? (
              <>
                <Plus className="h-3.5 w-3.5" />
                {t('Connect another')}
              </>
            ) : (
              t('Connect')
            )}
          </Button>
        </div>
        {hasExisting && (
          <div className="border-t bg-muted/30">
            {existing.map((conn, index) => {
              const isSelected = selectedExternalId === conn.externalId;
              return (
                <motion.button
                  key={conn.externalId}
                  type="button"
                  onClick={() =>
                    handleSelectExisting(conn.externalId, conn.displayName)
                  }
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.18,
                    delay: index * 0.04,
                    ease: 'easeOut',
                  }}
                  className={cn(
                    'group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/60 cursor-pointer',
                    index > 0 && 'border-t border-border/40',
                  )}
                >
                  <PieceIconWithPieceName
                    pieceName={pieceName}
                    size="xs"
                    border={false}
                    showTooltip={false}
                  />
                  <span className="flex-1 min-w-0 truncate text-sm">
                    {conn.displayName}
                  </span>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 400,
                        damping: 15,
                      }}
                      className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('Using {name}', { name: conn.displayName })}
                    </motion.span>
                  )}
                  {!isSelected && (
                    <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {t('Use this account')}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>
      {pieceModel && (
        <CreateOrEditConnectionDialog
          piece={pieceModel}
          open={dialogOpen}
          setOpen={(open, createdConnection) => {
            setDialogOpen(open);
            if (createdConnection) {
              setSelectedExternalId(createdConnection.externalId);
              void queryClient.invalidateQueries({
                queryKey: ['app-connections'],
              });
              onSend?.(
                `Done — ${connection.displayName} is connected. [auth externalId: ${createdConnection.externalId}]`,
              );
            }
          }}
          reconnectConnection={null}
          isGlobalConnection={false}
        />
      )}
    </>
  );
}

export function QuickReplies({
  replies,
  onSend,
}: {
  replies: string[];
  onSend: (text: string, files?: File[]) => void;
}) {
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {replies.map((reply, i) => (
        <motion.button
          key={reply}
          type="button"
          onClick={() => onSend(reply)}
          className="px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-muted transition-colors cursor-pointer"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: i * 0.06 }}
        >
          {reply}
        </motion.button>
      ))}
    </div>
  );
}
