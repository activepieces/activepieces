import {
  AppConnectionStatus,
  AppConnectionWithoutSensitiveData,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronDown,
  Pencil,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { appConnectionsApi } from '@/features/connections/api/app-connections';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import {
  ApProjectDisplay,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { authenticationSession } from '@/lib/authentication-session';

import { normalizePieceName } from '../lib/message-parsers';

const MAX_VISIBLE_CARDS = 3;
const CARD_PEEK = 10;

export function ConnectionsRequiredCard({
  connections,
  onResolve,
  onSendMessage,
}: {
  connections: ConnectionRequiredData[];
  onResolve?: (payload: Record<string, unknown>) => void;
  // Sends a chat reply (skip-all / typed answer). The server cancels the
  // pending connection gate's run when a new message arrives, so this both
  // dismisses the card and continues the conversation.
  onSendMessage?: (text: string) => void;
}) {
  const queryClient = useQueryClient();
  const currentProjectId = authenticationSession.getProjectId() ?? '';
  const [statusByPiece, setStatusByPiece] = useState<
    Record<string, PieceStatus>
  >({});
  const [existingConns, setExistingConns] = useState<
    Record<string, AppConnectionWithoutSensitiveData>
  >({});
  const [projectByPiece, setProjectByPiece] = useState<Record<string, string>>(
    {},
  );
  const [activeConnection, setActiveConnection] =
    useState<ConnectionRequiredData | null>(null);
  const finishedRef = useRef(false);

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
    if (!currentProjectId) return;
    let cancelled = false;

    void Promise.all(
      connections.map(async (conn) => {
        const result = await appConnectionsApi.list({
          projectId: currentProjectId,
          pieceName: normalizePieceName(conn.piece),
          limit: 1,
        });
        return { piece: conn.piece, connection: result.data[0] ?? null };
      }),
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, AppConnectionWithoutSensitiveData> = {};
      const alreadyActive = new Set<string>();
      for (const { piece, connection } of results) {
        if (connection) {
          map[piece] = connection;
          if (connection.status === AppConnectionStatus.ACTIVE) {
            alreadyActive.add(piece);
          }
        }
      }
      setExistingConns(map);
      if (alreadyActive.size > 0) {
        setStatusByPiece((prev) => {
          const next = { ...prev };
          for (const piece of alreadyActive) next[piece] = 'connected';
          return next;
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [connectionsKey, currentProjectId]);

  const allResolved = connections.every(
    (c) => statusByPiece[c.piece] !== undefined,
  );

  // Resolve the gate once every card is connected or skipped: proceed with the
  // connected accounts, or — when the user skipped everything — reply in chat so
  // the agent can continue conversationally.
  useEffect(() => {
    if (finishedRef.current || !allResolved) return;
    finishedRef.current = true;
    const connected = connections
      .filter((c) => statusByPiece[c.piece] === 'connected')
      .map((c) => ({
        piece: c.piece,
        displayName: c.displayName,
        connectionExternalId: existingConns[c.piece]?.externalId ?? null,
        projectId: projectByPiece[c.piece] ?? currentProjectId,
      }));
    if (connected.length > 0) {
      const skipped = connections
        .filter((c) => statusByPiece[c.piece] === 'skipped')
        .map((c) => ({ piece: c.piece, displayName: c.displayName }));
      onResolve?.({
        message: 'Connections resolved, continue building.',
        connections: connected,
        skipped,
      });
    } else {
      onSendMessage?.(t("Skip — I don't want to connect an account right now"));
    }
  }, [allResolved]); // eslint-disable-line react-hooks/exhaustive-deps

  function setCardProject(piece: string, projectId: string) {
    setProjectByPiece((prev) => ({ ...prev, [piece]: projectId }));
  }

  function skipConnection(piece: string) {
    setStatusByPiece((prev) => ({ ...prev, [piece]: 'skipped' }));
  }

  const pending = connections.filter(
    (c) => statusByPiece[c.piece] === undefined,
  );

  return (
    <>
      <ConnectionDeck
        pending={pending}
        existingConns={existingConns}
        projectByPiece={projectByPiece}
        currentProjectId={currentProjectId}
        onProjectChange={setCardProject}
        onConnect={setActiveConnection}
        onSkip={skipConnection}
        onSendMessage={onSendMessage}
      />

      {pieceModel && activeConnection && (
        <CreateOrEditConnectionDialog
          key={activeConnection.piece}
          piece={pieceModel}
          open={true}
          projectId={projectByPiece[activeConnection.piece] ?? currentProjectId}
          setOpen={(open, createdConnection) => {
            if (!open) {
              if (createdConnection) {
                setExistingConns((prev) => ({
                  ...prev,
                  [activeConnection.piece]: createdConnection,
                }));
                setStatusByPiece((prev) => ({
                  ...prev,
                  [activeConnection.piece]: 'connected',
                }));
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

function ConnectionDeck({
  pending,
  existingConns,
  projectByPiece,
  currentProjectId,
  onProjectChange,
  onConnect,
  onSkip,
  onSendMessage,
}: {
  pending: ConnectionRequiredData[];
  existingConns: Record<string, AppConnectionWithoutSensitiveData>;
  projectByPiece: Record<string, string>;
  currentProjectId: string;
  onProjectChange: (piece: string, projectId: string) => void;
  onConnect: (connection: ConnectionRequiredData) => void;
  onSkip: (piece: string) => void;
  onSendMessage?: (text: string) => void;
}) {
  const front = pending[0];
  const behindCount = Math.min(
    Math.max(pending.length - 1, 0),
    MAX_VISIBLE_CARDS - 1,
  );

  return (
    <div
      className="relative my-2"
      style={{ marginTop: behindCount * CARD_PEEK }}
    >
      {Array.from({ length: behindCount }).map((_, i) => {
        const depth = i + 1;
        return (
          <div
            key={depth}
            aria-hidden
            className="absolute inset-x-0 top-0 h-full rounded-2xl border bg-muted/30"
            style={{
              transform: `translateY(-${depth * CARD_PEEK}px) scaleX(${
                1 - depth * 0.03
              })`,
              transformOrigin: 'top center',
            }}
          />
        );
      })}
      <div className="relative overflow-hidden rounded-2xl border bg-background">
        <AnimatePresence mode="popLayout" initial={false}>
          {front && (
            <motion.div
              key={front.piece}
              initial={{ opacity: 0, y: -(CARD_PEEK + 12) }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <ConnectionRow
                connection={front}
                existingConn={existingConns[front.piece] ?? null}
                projectId={projectByPiece[front.piece] ?? currentProjectId}
                onProjectChange={(projectId) =>
                  onProjectChange(front.piece, projectId)
                }
                onConnect={() => onConnect(front)}
                onSkip={() => onSkip(front.piece)}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {onSendMessage && (
          <div className="border-t">
            <AnswerInput onSend={onSendMessage} />
          </div>
        )}
      </div>
    </div>
  );
}

function ConnectionRow({
  connection,
  existingConn,
  projectId,
  onProjectChange,
  onConnect,
  onSkip,
}: {
  connection: ConnectionRequiredData;
  existingConn: AppConnectionWithoutSensitiveData | null;
  projectId: string;
  onProjectChange: (projectId: string) => void;
  onConnect: () => void;
  onSkip: () => void;
}) {
  const pieceName = normalizePieceName(connection.piece);
  const { isLoading } = piecesHooks.usePiece({ name: pieceName });
  const needsReconnect =
    existingConn !== null && existingConn.status !== AppConnectionStatus.ACTIVE;

  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <PieceIconWithPieceName
        pieceName={pieceName}
        size="lg"
        border={true}
        showTooltip={false}
      />
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-base font-semibold">
            {t('Connect {name} in', { name: connection.displayName })}
          </span>
          <ProjectSelectorPill value={projectId} onChange={onProjectChange} />
        </div>
        <CapabilitiesLink pieceName={pieceName} />
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" onClick={onSkip}>
          {t('Skip')}
        </Button>
        <Button
          size="sm"
          className="gap-1"
          disabled={isLoading}
          onClick={onConnect}
        >
          {needsReconnect ? t('Reconnect') : t('Connect')}
          <ArrowUpRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function ProjectSelectorPill({
  value,
  onChange,
}: {
  value: string;
  onChange: (projectId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  // useAll() already scopes to the current user's visible projects.
  const { data: projects = [] } = projectCollectionUtils.useAll();
  const selected = projects.find((p) => p.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs hover:bg-muted"
        >
          {selected ? (
            <ApProjectDisplay
              title={getProjectName(selected)}
              icon={selected.icon}
              projectType={selected.type}
              iconClassName="size-3.5"
              titleClassName="text-xs font-medium"
            />
          ) : (
            <span className="text-muted-foreground">{t('Select project')}</span>
          )}
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t('Search projects')} />
          <CommandEmpty>{t('No projects found')}</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {projects.map((project) => (
              <CommandItem
                key={project.id}
                value={getProjectName(project)}
                onSelect={() => {
                  onChange(project.id);
                  setOpen(false);
                }}
                className="gap-2"
              >
                <ApProjectDisplay
                  title={getProjectName(project)}
                  icon={project.icon}
                  projectType={project.type}
                  iconClassName="size-4"
                  titleClassName="text-sm"
                />
                {project.id === value && (
                  <Check className="ml-auto size-4 text-primary" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CapabilitiesLink({ pieceName }: { pieceName: string }) {
  const { pieceModel } = piecesHooks.usePiece({ name: pieceName });
  const auth = pieceModel?.auth;
  const scopes =
    auth && 'scope' in auth && Array.isArray(auth.scope) ? auth.scope : [];
  const description =
    auth && 'description' in auth && typeof auth.description === 'string'
      ? auth.description
      : null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          {t('Check capabilities')}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="start">
        <div className="space-y-2">
          <div className="text-sm font-semibold">{t('Capabilities')}</div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {scopes.length > 0 ? (
            <ul className="space-y-1">
              {scopes.map((scope) => (
                <li
                  key={scope}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="size-3.5 shrink-0 text-green-600 dark:text-green-400" />
                  <span className="truncate">{scope}</span>
                </li>
              ))}
            </ul>
          ) : (
            !description && (
              <p className="text-sm text-muted-foreground">
                {t('No additional permissions required.')}
              </p>
            )
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AnswerInput({ onSend }: { onSend: (text: string) => void }) {
  const [value, setValue] = useState('');
  const trimmed = value.trim();

  function submit() {
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Pencil className="size-4" />
      </span>
      <input
        className="flex-1 min-w-0 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        placeholder={t('Type your answer...')}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
        }}
      />
      {trimmed && (
        <Button
          size="icon"
          className="size-7 shrink-0 rounded-full"
          onClick={submit}
          aria-label={t('Send')}
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
    </div>
  );
}

type PieceStatus = 'connected' | 'skipped';

export type ConnectionRequiredData = {
  piece: string;
  displayName: string;
  status?: 'missing' | 'error';
};
