import { t } from 'i18next';
import { Ban, Check, Contrast, Lock, LucideIcon, X } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';

import { followAlong } from '@/features/chat/lib/follow/follow-along';
import {
  ChangeLine,
  ChangeState,
} from '@/features/chat/lib/resources/change-summary';
import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';
import { getProjectName, projectCollectionUtils } from '@/features/projects';
import { cn } from '@/lib/utils';

import { useResourceName } from './resource-chip';

export function ChangesSummary({
  lines,
  announce,
}: {
  lines: ChangeLine[];
  announce: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  if (lines.length === 0) return null;
  const several = lines.length > 1;
  return (
    <div
      ref={containerRef}
      className={cn(
        'mt-2 text-sm',
        several &&
          'divide-y divide-gray-5 rounded-lg border border-gray-6 bg-gray-1',
      )}
      data-testid="chat-changes-summary"
    >
      {lines.map((line) => (
        <ChangeRow key={line.key} line={line} inCard={several} />
      ))}
      {announce && <Announcement lines={lines} containerRef={containerRef} />}
    </div>
  );
}

function ChangeRow({ line, inCard }: { line: ChangeLine; inCard: boolean }) {
  const name = useResourceName(line.ref);
  const label = name ?? resourceRegistry.kindInfo(line.ref.kind).label;
  const sentence = describeChange({ line, name: label });
  const { icon: Icon, className: iconClass } = STATE_ICON[line.state];
  const linked = isLinkable(line);
  const otherProject = !resourceRegistry.isInCurrentProject(line.ref);
  return (
    <div className={cn('flex flex-col gap-0.5', inCard ? 'px-3 py-2' : 'py-1')}>
      <div className="flex min-w-0 items-start gap-2">
        <Icon className={cn('mt-0.5 size-4 shrink-0', iconClass)} aria-hidden />
        <div className="min-w-0 flex-1">
          {linked ? (
            <ResourceLink
              resource={line.ref}
              className="text-gray-12 underline-offset-2 hover:underline"
            >
              <span data-change-sentence>{sentence}</span>
            </ResourceLink>
          ) : (
            <span data-change-sentence className="text-gray-12">
              {sentence}
            </span>
          )}
          {line.state === 'partial' && (
            <span className="sr-only">{t('Partly applied.')}</span>
          )}
          {otherProject && line.ref.projectId && (
            <span className="ml-1.5 text-xs text-gray-11">
              <Suspense fallback={t('in another project')}>
                <ProjectName projectId={line.ref.projectId} />
              </Suspense>
            </span>
          )}
        </div>
      </div>
      {line.draft && line.state !== 'forbidden' && (
        <div className="flex items-center gap-2 pl-6 text-xs text-gray-11">
          <span>{t('Draft · not published')}</span>
          <ResourceLink
            resource={line.ref}
            className="font-medium text-accent-11 underline-offset-2 hover:underline"
          >
            {t('Publish')}
          </ResourceLink>
        </div>
      )}
    </div>
  );
}

export function ResourceLink({
  resource,
  className,
  children,
}: {
  resource: ResourceRef;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={resourceRegistry.route(resource)}
      onClick={(event) => onResourceLinkClick({ event, resource })}
      className={cn(
        'rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-8',
        className,
      )}
    >
      {children}
    </a>
  );
}

export function openChangedResource(resource: ResourceRef): void {
  followAlong.view(resource);
}

export function onResourceLinkClick({
  event,
  resource,
}: {
  event: React.MouseEvent<HTMLAnchorElement>;
  resource: ResourceRef;
}): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  event.preventDefault();
  openChangedResource(resource);
}

export function describeChange({
  line,
  name,
}: {
  line: ChangeLine;
  name: string;
}): string {
  const { facts, state } = line;
  if (state === 'failed') return t("{name} · didn't apply", { name });
  if (state === 'declined') return t('{name} · you declined this', { name });
  if (state === 'forbidden') return t('{name} · no access', { name });
  if (facts.deleted) return t('{name} · deleted', { name });
  if (facts.created) return describeCreated({ line, name });
  if (facts.rowsAdded > 0 && facts.rowsAdded < facts.rowsRequested) {
    return t('{name} · {done} of {total} rows added', {
      name,
      done: facts.rowsAdded,
      total: facts.rowsRequested,
    });
  }
  const counted = COUNTED_FACTS.find(({ count }) => count(line) > 0);
  if (counted) return counted.sentence({ name, count: counted.count(line) });
  if (facts.published) return t('{name} · published', { name });
  if (facts.statusChanged) return t('{name} · status changed', { name });
  if (facts.renamed) return t('{name} · renamed', { name });
  return t('{name} · updated', { name });
}

function describeCreated({
  line,
  name,
}: {
  line: ChangeLine;
  name: string;
}): string {
  const { facts } = line;
  if (line.ref.kind === 'table') {
    return facts.rowsAdded > 0
      ? t(
          '{name} · table created with {count, plural, one {# row} other {# rows}}',
          { name, count: facts.rowsAdded },
        )
      : t('{name} · table created', { name });
  }
  if (line.ref.kind === 'flow') {
    return facts.stepsAdded > 0
      ? t(
          '{name} · flow created with {count, plural, one {# step} other {# steps}}',
          { name, count: facts.stepsAdded },
        )
      : t('{name} · flow created', { name });
  }
  return t('{name} · created', { name });
}

function Announcement({
  lines,
  containerRef,
}: {
  lines: ChangeLine[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [text, setText] = useState('');
  useEffect(() => {
    const replyKey = String(lastStreamingAt);
    const recent = Date.now() - lastStreamingAt < ANNOUNCE_WINDOW_MS;
    if (!recent || announcedReplies.has(replyKey)) return;
    announcedReplies.add(replyKey);
    let fired = false;
    const timer = setTimeout(() => {
      fired = true;
      const sentences = containerRef.current?.querySelectorAll(
        '[data-change-sentence]',
      );
      setText(
        [...(sentences ?? [])]
          .map((sentence) => sentence.textContent ?? '')
          .join('. '),
      );
    }, ANNOUNCE_DELAY_MS);
    return () => {
      clearTimeout(timer);
      if (!fired) announcedReplies.delete(replyKey);
    };
  }, [lines, containerRef]);
  return (
    <div className="sr-only" aria-live="polite" aria-atomic>
      {text}
    </div>
  );
}

function markReplyStreaming(): void {
  lastStreamingAt = Date.now();
}

function ProjectName({ projectId }: { projectId: string }) {
  const { data: projects } = projectCollectionUtils.useAll();
  const project = projects.find((candidate) => candidate.id === projectId);
  return (
    <>
      {project
        ? t('in {project}', { project: getProjectName(project) })
        : t('in another project')}
    </>
  );
}

function isLinkable(line: ChangeLine): boolean {
  return !line.facts.deleted && line.state !== 'forbidden';
}

let lastStreamingAt = 0;
const announcedReplies = new Set<string>();

const ANNOUNCE_DELAY_MS = 600;
const ANNOUNCE_WINDOW_MS = 15_000;

const STATE_ICON: Record<ChangeState, { icon: LucideIcon; className: string }> =
  {
    applied: { icon: Check, className: 'text-accent-11' },
    partial: { icon: Contrast, className: 'text-accent-11' },
    failed: { icon: X, className: 'text-gray-11' },
    declined: { icon: Ban, className: 'text-gray-11' },
    forbidden: { icon: Lock, className: 'text-gray-11' },
  };

const COUNTED_FACTS: {
  count: (line: ChangeLine) => number;
  sentence: (args: { name: string; count: number }) => string;
}[] = [
  {
    count: (line) => line.facts.rowsAdded,
    sentence: (args) =>
      t(
        '{name} · {count, plural, one {# row added} other {# rows added}}',
        args,
      ),
  },
  {
    count: (line) => line.facts.rowsDeleted,
    sentence: (args) =>
      t(
        '{name} · {count, plural, one {# row deleted} other {# rows deleted}}',
        args,
      ),
  },
  {
    count: (line) => line.facts.rowsUpdated,
    sentence: (args) =>
      t(
        '{name} · {count, plural, one {# row updated} other {# rows updated}}',
        args,
      ),
  },
  {
    count: (line) => line.facts.fieldsChanged,
    sentence: (args) =>
      t(
        '{name} · {count, plural, one {# field changed} other {# fields changed}}',
        args,
      ),
  },
  {
    count: (line) => line.facts.stepsAdded,
    sentence: (args) =>
      t(
        '{name} · {count, plural, one {# step added} other {# steps added}}',
        args,
      ),
  },
  {
    count: (line) => line.facts.stepsUpdated,
    sentence: (args) =>
      t(
        '{name} · {count, plural, one {# step updated} other {# steps updated}}',
        args,
      ),
  },
  {
    count: (line) => line.facts.stepsRemoved,
    sentence: (args) =>
      t(
        '{name} · {count, plural, one {# step removed} other {# steps removed}}',
        args,
      ),
  },
];

export const changesAnnouncer = { markReplyStreaming };
