import { t } from 'i18next';
import { Check, Zap } from 'lucide-react';
import { useState } from 'react';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { Markdown } from '@/components/prompt-kit/markdown';
import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

import {
  AutomationProposal,
  ConnectionRequired,
  parseAllConnectionsRequired,
  parseAutomationProposal,
  parseQuickReplies,
} from '../lib/message-parsers';

export function MessageContentWithAuth({
  content,
  onSend,
  isStreaming = false,
  connectedPieces,
  onPieceConnected,
}: {
  content: string;
  onSend?: (text: string) => void;
  isStreaming?: boolean;
  connectedPieces?: Set<string>;
  onPieceConnected?: (piece: string) => void;
}) {
  const hasAuthUrl = /https?:\/\/[^\s]*\/authorize\?[^\s]*/.test(content);

  if (hasAuthUrl) {
    const cleanContent = content
      .replace(/https?:\/\/[^\s]*\/authorize\?[^\s]*/g, '')
      .replace(/Please open this URL in your browser to authorize:?\s*/gi, '')
      .replace(/After authorizing.*$/gis, '')
      .replace(/If the browser shows.*$/gis, '')
      .replace(/If you see a connection error.*$/gis, '')
      .replace(/Once you've completed.*$/gis, '')
      .replace(/paste the full URL.*$/gis, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return (
      <div className="space-y-3">
        {cleanContent && (
          <div className="prose dark:prose-invert max-w-none break-words text-sm [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]:mt-6 [&_h2]:mt-5 [&_h3]:mt-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_table]:mb-4">
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

  if (isStreaming) {
    return (
      <div className="prose dark:prose-invert max-w-none break-words text-sm [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]:mt-6 [&_h2]:mt-5 [&_h3]:mt-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_table]:mb-4">
        <Markdown>{content}</Markdown>
      </div>
    );
  }

  const { proposal, cleanContent: afterProposal } =
    parseAutomationProposal(content);
  const { connections, cleanContent: afterConnection } =
    parseAllConnectionsRequired(afterProposal);
  const { cleanContent: finalContent } = parseQuickReplies(afterConnection);

  return (
    <div className="space-y-2">
      {finalContent && (
        <div className="prose dark:prose-invert max-w-none break-words text-sm [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h1]:mt-6 [&_h2]:mt-5 [&_h3]:mt-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_table]:mb-4">
          <Markdown>{finalContent}</Markdown>
        </div>
      )}
      {connections.map((conn) => (
        <ConnectionRequiredCard
          key={conn.piece}
          connection={conn}
          onSend={onSend}
          connectedPieces={connectedPieces}
          onPieceConnected={onPieceConnected}
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
    <div className="rounded-xl border bg-background shadow-sm overflow-hidden my-2">
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
              <span className="text-foreground/80">{step}</span>
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

export function ConnectionRequiredCard({
  connection,
  onSend,
  connectedPieces,
  onPieceConnected,
}: {
  connection: ConnectionRequired;
  onSend?: (text: string) => void;
  connectedPieces?: Set<string>;
  onPieceConnected?: (piece: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const connected = connectedPieces?.has(connection.piece) ?? false;
  const shortName = connection.piece.replace(/[^a-z0-9-]/gi, '');
  const pieceName = connection.piece.startsWith('@activepieces/')
    ? connection.piece
    : `@activepieces/piece-${shortName}`;
  const { pieceModel, isLoading } = piecesHooks.usePiece({ name: pieceName });

  return (
    <>
      <div className="rounded-xl border bg-background shadow-sm overflow-hidden my-2">
        <div className="p-4 flex items-center gap-3">
          <PieceIconWithPieceName
            pieceName={pieceName}
            size="sm"
            border={false}
            showTooltip={false}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              {connected
                ? t('{name} connected', { name: connection.displayName })
                : t('Connect {name}', { name: connection.displayName })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {connected
                ? t('Ready to use')
                : t('This automation needs a {name} connection to work', {
                    name: connection.displayName,
                  })}
            </p>
          </div>
          {connected ? (
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shrink-0"
              disabled={isLoading}
              onClick={() => setDialogOpen(true)}
            >
              {t('Connect')}
            </Button>
          )}
        </div>
      </div>
      {pieceModel && (
        <CreateOrEditConnectionDialog
          piece={pieceModel}
          open={dialogOpen}
          setOpen={(open, createdConnection) => {
            setDialogOpen(open);
            if (createdConnection) {
              onPieceConnected?.(connection.piece);
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
    <div className="flex flex-wrap gap-2 py-2 animate-in fade-in duration-300">
      {replies.map((reply) => (
        <button
          key={reply}
          type="button"
          onClick={() => onSend(reply)}
          className="px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-muted transition-colors cursor-pointer"
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
