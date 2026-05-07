import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Markdown } from '@/components/prompt-kit/markdown';
import { Button } from '@/components/ui/button';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { authenticationSession } from '@/lib/authentication-session';

import {
  AutomationProposal,
  ConnectionRequired,
  normalizePieceName,
  parseAllConnectionsRequired,
  parseAutomationProposal,
  parseBuildProgress,
  parseConnectionPicker,
  parseMultiQuestion,
  parseProjectPicker,
  parseQuickReplies,
  stripIncompleteSpecialBlock,
} from '../lib/message-parsers';

import { ConnectionPickerCard } from './connection-picker-card';
import { ProjectPickerCard } from './project-picker-card';

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
  selectedProjectId,
  onSelectProject,
  isLastMessage = false,
}: {
  content: string;
  onSend?: (text: string) => void;
  selectedProjectId?: string | null;
  onSelectProject?: (projectId: string) => void;
  isLastMessage?: boolean;
}) {
  const hasAuthUrl = AUTH_URL_PATTERN.test(content);

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

  const { proposal, cleanContent: afterProposal } =
    parseAutomationProposal(content);
  const { connections, cleanContent: afterConnection } =
    parseAllConnectionsRequired(afterProposal);
  const { picker: connectionPicker, cleanContent: afterPicker } =
    parseConnectionPicker(afterConnection);
  const { picker: projectPicker, cleanContent: afterProjectPicker } =
    parseProjectPicker(afterPicker);
  const { progress: buildProgress, cleanContent: afterBuildProgress } =
    parseBuildProgress(afterProjectPicker);
  const { cleanContent: afterQuestions } =
    parseMultiQuestion(afterBuildProgress);
  const { cleanContent: afterReplies } = parseQuickReplies(afterQuestions);
  const strippedContent = buildProgress
    ? afterReplies
        .replace(/\[.*?\]\(https?:\/\/[^\s)]*\/flows\/[^\s)]*\)\s*/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    : afterReplies;
  const finalContent = stripIncompleteSpecialBlock(strippedContent);

  return (
    <div className="space-y-2">
      {finalContent && (
        <div className={PROSE_CLASSES}>
          <Markdown>{finalContent}</Markdown>
        </div>
      )}
      {connections.length > 0 && (
        <ConnectionsRequiredCard connections={connections} onSend={onSend} />
      )}
      {connectionPicker && (
        <ConnectionPickerCard
          picker={connectionPicker}
          onSelect={(text) => onSend?.(text)}
          isInteractive={isLastMessage}
        />
      )}
      {projectPicker && (
        <ProjectPickerCard
          picker={projectPicker}
          selectedProjectId={selectedProjectId}
          isInteractive={isLastMessage}
          onSelect={(projectId, projectName) => {
            onSelectProject?.(projectId);
            onSend?.(`Use ${projectName}.`);
          }}
        />
      )}
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

        <div className="space-y-1.5 ml-12">
          {proposal.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-xs font-medium text-muted-foreground bg-muted rounded-full h-5 w-5 flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="text-foreground/80">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t px-4 py-3 bg-muted/30">
        <Button size="sm" className="gap-1.5" onClick={onBuild}>
          <Zap className="h-3.5 w-3.5" />
          {t('Build this automation')}
        </Button>
      </div>
    </div>
  );
}

function ConnectionRow({
  connection,
  isConnected,
  existingConn,
  onConnect,
}: {
  connection: ConnectionRequired;
  isConnected: boolean;
  existingConn: AppConnectionWithoutSensitiveData | null;
  onConnect: () => void;
}) {
  const pieceName = normalizePieceName(connection.piece);
  const { isLoading } = piecesHooks.usePiece({ name: pieceName });
  const isReconnect =
    existingConn !== null && existingConn.status !== AppConnectionStatus.ACTIVE;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0">
      <PieceIconWithPieceName
        pieceName={pieceName}
        size="sm"
        border={false}
        showTooltip={false}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{connection.displayName}</div>
        <div className="text-xs text-muted-foreground">
          {isConnected
            ? t('Ready to use')
            : isReconnect
            ? t('Your {name} connection is expired', {
                name: connection.displayName,
              })
            : t('Not connected')}
        </div>
      </div>
      {isConnected ? (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="shrink-0 flex items-center justify-center"
        >
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
        </motion.span>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 shrink-0"
          disabled={isLoading}
          onClick={onConnect}
        >
          {isReconnect ? t('Reconnect') : t('Connect')}
        </Button>
      )}
    </div>
  );
}

function ConnectionsRequiredCard({
  connections,
  onSend,
}: {
  connections: ConnectionRequired[];
  onSend?: (text: string) => void;
}) {
  const queryClient = useQueryClient();
  const [connectedSet, setConnectedSet] = useState<Set<string>>(new Set());
  const [existingConns, setExistingConns] = useState<
    Record<string, AppConnectionWithoutSensitiveData>
  >({});
  const [activeConnection, setActiveConnection] =
    useState<ConnectionRequired | null>(null);
  const [continued, setContinued] = useState(false);

  const activePieceName = activeConnection
    ? normalizePieceName(activeConnection.piece)
    : null;
  const { pieceModel } = piecesHooks.usePiece({
    name: activePieceName ?? '',
    enabled: !!activePieceName,
  });

  const connectionsKey = useMemo(
    () => connections.map((c) => c.piece).join(','),
    [connections],
  );

  useEffect(() => {
    const projectId = authenticationSession.getProjectId();
    if (!projectId) return;
    let cancelled = false;

    void Promise.all(
      connections.map(async (conn) => {
        const pieceName = normalizePieceName(conn.piece);
        const result = await appConnectionsApi.list({
          projectId,
          pieceName,
          limit: 1,
        });
        return { piece: conn.piece, connection: result.data[0] ?? null };
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, AppConnectionWithoutSensitiveData> = {};
      const alreadyActive = new Set<string>();
      const aiErrorPieces = new Set(
        connections.filter((c) => c.status === 'error').map((c) => c.piece),
      );
      for (const { piece, connection } of results) {
        if (connection) {
          map[piece] = connection;
          if (
            connection.status === AppConnectionStatus.ACTIVE &&
            !aiErrorPieces.has(piece)
          ) {
            alreadyActive.add(piece);
          }
        }
      }
      setExistingConns(map);
      if (alreadyActive.size > 0) {
        setConnectedSet(alreadyActive);
      }
      if (alreadyActive.size === connections.length) {
        setContinued(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [connectionsKey]);

  const allConnected = connections.every((c) => connectedSet.has(c.piece));

  function handleConnect(connection: ConnectionRequired) {
    setActiveConnection(connection);
  }

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
        {connections.map((conn) => (
          <ConnectionRow
            key={conn.piece}
            connection={conn}
            isConnected={connectedSet.has(conn.piece)}
            existingConn={existingConns[conn.piece] ?? null}
            onConnect={() => handleConnect(conn)}
          />
        ))}

        {allConnected && (
          <div className="border-t px-4 py-3 bg-muted/30">
            {continued ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                {t('All connected')}
              </div>
            ) : (
              onSend && (
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setContinued(true);
                    onSend(t('All connections are ready, continue building.'));
                  }}
                >
                  <Check className="h-3.5 w-3.5" />
                  {t('Continue')}
                </Button>
              )
            )}
          </div>
        )}
      </motion.div>

      {pieceModel && activeConnection && (
        <CreateOrEditConnectionDialog
          key={activeConnection.piece}
          piece={pieceModel}
          open={true}
          setOpen={(open, createdConnection) => {
            if (!open) {
              if (createdConnection) {
                setConnectedSet((prev) => {
                  const next = new Set(prev);
                  next.add(activeConnection.piece);
                  return next;
                });
                void queryClient.invalidateQueries({
                  queryKey: ['app-connections'],
                });
              }
              setActiveConnection(null);
            }
          }}
          reconnectConnection={existingConns[activeConnection.piece] ?? null}
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
