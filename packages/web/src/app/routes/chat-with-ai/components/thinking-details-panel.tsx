import { isObject } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Brain,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  Plus,
  Search,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

import { SimpleJsonViewer } from '@/components/custom/simple-json-viewer';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AnyToolPart,
  ChatUIMessage,
  chatPartUtils,
} from '@/features/chat/lib/chat-types';
import { chatUtils } from '@/features/chat/lib/chat-utils';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';
import { cn } from '@/lib/utils';

import { normalizePieceName } from '../lib/message-parsers';

function getToolIcon(toolName: string) {
  const name = toolName.toLowerCase();
  if (name.includes('list_pieces') || name.includes('list_across'))
    return Search;
  if (name.includes('validate') || name.includes('test')) return CheckCircle;
  if (name.includes('create_flow') || name.includes('add_step')) return Plus;
  if (name.includes('run_action') || name.includes('run_one_time')) return Zap;
  return Wrench;
}

function extractPieceName(part: AnyToolPart): string | null {
  if (!chatPartUtils.isReady(part)) return null;
  const input = isObject(part.input) ? part.input : undefined;
  if (!input) return null;
  if (typeof input.pieceName === 'string') {
    return chatUtils.stripPiecePrefix(input.pieceName);
  }
  if (
    isObject(input.settings) &&
    typeof input.settings.pieceName === 'string'
  ) {
    return chatUtils.stripPiecePrefix(input.settings.pieceName);
  }
  return null;
}

export function ThinkingDetailsPanel({
  messageParts,
  onClose,
}: {
  messageParts: ChatUIMessage['parts'];
  onClose: () => void;
}) {
  const steps: ThinkingStep[] = [];

  for (const p of messageParts) {
    if (p.type === 'reasoning' && p.text.length > 0) {
      steps.push({ kind: 'reasoning', text: p.text });
    } else if (p.type === 'text' && p.text.length > 0) {
      steps.push({ kind: 'text', text: p.text });
    } else if (chatPartUtils.isAnyToolPart(p)) {
      const name = chatPartUtils.getToolPartName(p);
      if (
        !chatPartUtils.HIDDEN_TOOL_NAMES.has(name) &&
        !chatPartUtils.isDisplayTool(name)
      ) {
        steps.push({ kind: 'tool', part: p });
      }
    }
  }

  if (steps.length === 0) return null;

  return (
    <div className="rounded-xl border bg-background shadow-sm">
      <div className="flex items-center justify-between px-4 py-2.5 border-b">
        <h3 className="text-sm font-medium">{t('Thinking details')}</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="px-4 py-4 max-h-[450px] overflow-y-auto">
        <div className="flex flex-col">
          {steps.map((step, i) => {
            const showConnector = i < steps.length - 1;
            if (step.kind === 'reasoning') {
              return (
                <TextStep
                  key={`r-${i}`}
                  text={step.text}
                  showConnector={showConnector}
                  variant="reasoning"
                />
              );
            }
            if (step.kind === 'text') {
              return (
                <TextStep
                  key={`t-${i}`}
                  text={step.text}
                  showConnector={showConnector}
                  variant="response"
                />
              );
            }
            return (
              <ToolStep
                key={step.part.toolCallId}
                part={step.part}
                showConnector={showConnector}
              />
            );
          })}
        </div>
      </div>

      <div className="flex justify-end px-4 py-2.5 border-t">
        <Button variant="outline" size="sm" onClick={onClose}>
          {t('Done')}
        </Button>
      </div>
    </div>
  );
}

function ToolStep({
  part,
  showConnector,
}: {
  part: AnyToolPart;
  showConnector: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toolName = chatPartUtils.getToolPartName(part);
  const pieceName = extractPieceName(part);
  const Icon = getToolIcon(toolName);
  const label =
    chatUtils.formatToolLabel({ part }) ??
    chatUtils.humanizePieceName(chatUtils.stripPiecePrefix(toolName));

  const hasData =
    chatPartUtils.isReady(part) &&
    (part.input !== undefined || part.state === 'output-available');

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center justify-center size-6 rounded-lg bg-muted">
          {pieceName ? (
            <PieceIconWithPieceName
              pieceName={normalizePieceName(pieceName)}
              size="xs"
              border={false}
              showTooltip={false}
            />
          ) : (
            <Icon className="size-3.5 text-muted-foreground" />
          )}
        </div>
        {showConnector && <div className="w-px flex-1 bg-border" />}
      </div>

      <div className="flex-1 min-w-0 pb-7">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger
            disabled={!hasData}
            className={cn(
              'flex items-center gap-1 text-sm text-foreground',
              hasData && 'hover:text-primary cursor-pointer',
            )}
          >
            <span className="truncate">{label}</span>
            {hasData && (
              <ChevronRight
                className={cn(
                  'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                  isOpen && 'rotate-90',
                )}
              />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
            <ToolIODetails part={part} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

function TextStep({
  text,
  showConnector,
  variant,
}: {
  text: string;
  showConnector: boolean;
  variant: 'reasoning' | 'response';
}) {
  const Icon = variant === 'reasoning' ? Brain : MessageSquare;

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div className="flex items-center justify-center size-6 rounded-lg bg-muted">
          <Icon className="size-3.5 text-muted-foreground" />
        </div>
        {showConnector && <div className="w-px flex-1 bg-border" />}
      </div>
      <div className="flex-1 min-w-0 pb-7 pt-1">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {text}
        </p>
      </div>
    </div>
  );
}

function ToolIODetails({ part }: { part: AnyToolPart }) {
  const toolOutput = chatPartUtils.parseToolOutput(part);

  return (
    <div className="mt-1.5 space-y-2">
      {part.input !== undefined && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            {t('Input')}
          </span>
          <div className="mt-0.5 rounded-md border bg-muted/50 overflow-hidden">
            <SimpleJsonViewer
              data={part.input}
              hideCopyButton={true}
              maxHeight={150}
            />
          </div>
        </div>
      )}
      {toolOutput.state === 'success' && (
        <div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            {t('Output')}
          </span>
          <div className="mt-0.5 rounded-md border bg-muted/50 overflow-hidden">
            <SimpleJsonViewer
              data={toolOutput.data}
              hideCopyButton={true}
              maxHeight={150}
            />
          </div>
        </div>
      )}
      {toolOutput.state === 'error' && (
        <div>
          <span className="text-[10px] font-medium text-destructive uppercase">
            {t('Error')}
          </span>
          <p className="mt-0.5 text-xs text-destructive">
            {toolOutput.errorText}
          </p>
        </div>
      )}
    </div>
  );
}

type ThinkingStep =
  | { kind: 'reasoning'; text: string }
  | { kind: 'text'; text: string }
  | { kind: 'tool'; part: AnyToolPart };
