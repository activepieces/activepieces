import { ToolUIPart } from 'ai';
import { t } from 'i18next';
import { AlertCircle, Check, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

const TOOL_VERBS: Record<string, string> = {
  research: 'Researching',
  web_search: 'Searching',
  read_url: 'Reading',
  search_github_code: 'Searching repo',
  read_github_file: 'Reading',
  list_github_directory: 'Browsing',
};

const TOOL_NOUNS: Record<string, string> = {
  research: 'Docs research',
  web_search: 'Web search',
  read_url: 'Page read',
  search_github_code: 'Code search',
  read_github_file: 'File read',
  list_github_directory: 'Directory list',
};

export function InlineToolCluster({
  parts,
  streaming,
}: {
  parts: ToolUIPart[];
  /** True only for the trailing cluster of a still-streaming message. */
  streaming?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const running = parts.find((p) => isRunning(p.state));
  const hasError = parts.some((p) => p.state === 'output-error');
  const total = parts.length;

  if (total === 0) return null;

  if (streaming && running) {
    const runningIdx = parts.indexOf(running);
    const stepNumber = runningIdx + 1;
    const label = liveLabelFor(running);

    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="my-2 flex items-center gap-2.5 text-[12px] leading-none"
      >
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/50" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span className="truncate font-medium text-foreground/80 animate-pulse">
          {label}
        </span>
        {stepNumber > 1 && (
          <span className="shrink-0 rounded-full bg-muted/60 px-1.5 py-0.5 font-mono text-[9.5px] text-muted-foreground/80">
            {t('copilotStep', { count: stepNumber })}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="my-1.5"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/70 transition-colors hover:text-foreground"
        aria-expanded={expanded}
      >
        {hasError ? (
          <AlertCircle
            className="size-3 text-amber-500 dark:text-amber-400"
            aria-hidden
          />
        ) : (
          <Check
            className="size-3 text-muted-foreground/60 transition-colors group-hover:text-foreground/80"
            aria-hidden
          />
        )}
        <span>{t('copilotStepCount', { count: total })}</span>
        <ChevronRight
          className={cn('size-3 transition-transform', expanded && 'rotate-90')}
          aria-hidden
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <ul className="mt-1.5 ml-1 space-y-1 border-l border-border/50 pl-3 text-[11px] text-muted-foreground/70">
              {parts.map((p, i) => {
                const toolName = stripToolPrefix(p.type);
                const detail = detailFor(p);
                return (
                  <li key={i} className="flex items-center gap-2">
                    <span className="size-1 shrink-0 rounded-full bg-muted-foreground/40" />
                    <span className="text-muted-foreground/85">
                      {t(TOOL_NOUNS[toolName] ?? toolName)}
                    </span>
                    {detail && (
                      <span className="flex-1 truncate font-mono text-[10.5px] text-muted-foreground/60">
                        · {detail}
                      </span>
                    )}
                    {!detail && <span className="flex-1" />}
                    {p.state === 'output-error' && (
                      <span className="text-amber-500 dark:text-amber-400">
                        {t('error')}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function isRunning(state: ToolUIPart['state']): boolean {
  return state === 'input-streaming' || state === 'input-available';
}

function stripToolPrefix(type: string): string {
  return type.startsWith('tool-') ? type.slice('tool-'.length) : type;
}

function liveLabelFor(part: ToolUIPart): string {
  const toolName = stripToolPrefix(part.type);
  const verb = TOOL_VERBS[toolName] ?? toolName.replace(/_/g, ' ');
  const detail = detailFor(part);
  if (!detail) return `${t(verb)}…`;
  const shortened = detail.length > 50 ? detail.slice(0, 50) + '…' : detail;
  return `${t(verb)} ${shortened}`;
}

function detailFor(part: ToolUIPart): string {
  const input = (part.input ?? {}) as Record<string, unknown>;
  const queries = input['queries'];
  if (Array.isArray(queries) && typeof queries[0] === 'string') {
    return queries[0];
  }
  for (const key of ['query', 'url', 'filePath', 'dirPath', 'path']) {
    const value = input[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return shortenUrl(value);
    }
  }
  return '';
}

function shortenUrl(value: string): string {
  if (!value.startsWith('http')) return value;
  try {
    const u = new URL(value);
    return u.hostname + u.pathname;
  } catch {
    return value;
  }
}
