import { t } from 'i18next';
import { Zap } from 'lucide-react';

import { Markdown } from '@/components/prompt-kit/markdown';

import {
  parseAllConnectionsRequired,
  parseAutomationProposal,
  parseQuickReplies,
} from '../lib/message-parsers';

import { AutomationProposalCard } from './automation-proposal-card';
import { ConnectionRequiredCard } from './connection-required-card';

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
  const { cleanContent: finalContent } = parseQuickReplies(afterConnection);

  return (
    <div className="space-y-2">
      {finalContent && (
        <div className={PROSE_CLASSES}>
          <Markdown>{finalContent}</Markdown>
          {isStreaming && (
            <span className="inline-block w-[2px] h-[1em] bg-foreground align-text-bottom ml-0.5 animate-[blink-cursor_1s_step-end_infinite]" />
          )}
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

const PROSE_CLASSES =
  'max-w-none break-words text-sm [&_p]:mb-4 [&_p:last-child]:mb-0 [&_table]:mb-4';

const AUTH_URL_PATTERN = /https?:\/\/[^\s]*\/authorize\?[^\s]*/;
