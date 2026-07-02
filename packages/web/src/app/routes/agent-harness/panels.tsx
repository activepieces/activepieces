import { chatHarnessCatalog, chatToolPhases } from '@activepieces/shared';
import { useMemo, useState } from 'react';

import { Markdown } from '@/components/prompt-kit/markdown';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

import {
  harnessUtils,
  HarnessSources,
  HarnessScorecardRow,
} from './harness-utils';

function SourcesNotice({ isLoading }: { isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? 'Loading prompt sources…'
            : 'Prompt sources unavailable — the chat feature must be enabled and you must be signed in. The Tools, Assembly and Scorecard tabs work offline.'}
        </p>
      </CardContent>
    </Card>
  );
}

export function SystemPromptPanel({
  system,
  isLoading,
}: {
  system?: string;
  isLoading: boolean;
}) {
  const sections = useMemo(
    () => harnessUtils.parseSystemPromptSections(system ?? ''),
    [system],
  );
  const [active, setActive] = useState<string | null>(null);
  const total = harnessUtils.estimateTokens(system ?? '');
  const current = sections.find((s) => s.tag === active) ?? sections[0] ?? null;

  if (sections.length === 0) {
    return <SourcesNotice isLoading={isLoading} />;
  }

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6">
      <div className="flex flex-col gap-1">
        <div className="px-2 pb-2 text-xs font-medium text-muted-foreground">
          {sections.length} sections · ~{harnessUtils.formatTokens(total)} tok
        </div>
        {sections.map((section) => (
          <button
            key={section.tag}
            onClick={() => setActive(section.tag)}
            className={cn(
              'flex items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors',
              section.tag === current?.tag
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground hover:bg-accent/50',
            )}
          >
            <span className="truncate font-mono text-xs">{section.tag}</span>
            <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
              {harnessUtils.formatTokens(section.tokens)}
            </span>
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          {current ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="accent" className="font-mono">
                  {`<${current.tag}>`}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ~{harnessUtils.formatTokens(current.tokens)} tokens
                </span>
              </div>
              <Markdown>{current.content}</Markdown>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No sections parsed.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function GuidesPanel({
  guides,
  isLoading,
}: {
  guides?: Record<string, string>;
  isLoading: boolean;
}) {
  if (!guides) {
    return <SourcesNotice isLoading={isLoading} />;
  }
  return (
    <Accordion type="single" collapsible className="w-full">
      {chatHarnessCatalog.guides.map((meta) => {
        const content = guides[meta.topic] ?? '';
        const tokens = harnessUtils.estimateTokens(content);
        return (
          <AccordionItem key={meta.topic} value={meta.topic}>
            <AccordionTrigger>
              <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                <div className="flex flex-col items-start text-left">
                  <span className="font-medium">{meta.title}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    Loads when: {meta.loadTrigger}
                  </span>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  ~{harnessUtils.formatTokens(tokens)} tok
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  {content ? (
                    <Markdown>{content}</Markdown>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Guide source not found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export function ToolsPanel() {
  const groups = chatHarnessCatalog.toolsByCategory();
  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.key}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <span className="text-xs text-muted-foreground">
              {group.tools.length}
            </span>
          </div>
          <Card>
            <CardContent className="flex flex-col divide-y divide-border p-0">
              {group.tools.map((tool) => {
                const buildOnly = chatToolPhases.isBuildOnlyTool(tool.name);
                const thinking = chatToolPhases.isThinkingTool(tool.name);
                const hidden = chatToolPhases.isChatHiddenTool(tool.name);
                return (
                  <div
                    key={tool.name}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-medium">{tool.name}</code>
                        {tool.mutates ? (
                          <Badge variant="destructive">write</Badge>
                        ) : (
                          <Badge variant="success">read</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {tool.purpose}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <Badge variant={buildOnly ? 'accent' : 'outline'}>
                        {buildOnly ? 'build-only' : 'discovery'}
                      </Badge>
                      {thinking && <Badge variant="secondary">thinking</Badge>}
                      {hidden && <Badge variant="ghost">chat-hidden</Badge>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

export function PipelinePanel({ sources }: { sources?: HarnessSources }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        How the final system prompt is assembled and injected per turn, in
        order.
      </p>
      {chatHarnessCatalog.pipeline.map((stage, index) => (
        <Card key={stage.stage}>
          <CardContent className="flex items-start gap-4 pt-6">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{stage.title}</span>
                <Badge variant="outline" className="font-normal">
                  {stage.condition}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {stage.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
      {sources && (
        <>
          <Separator className="my-2" />
          <p className="text-xs text-muted-foreground">
            Context templates · selected project: ~
            {harnessUtils.formatTokens(
              harnessUtils.estimateTokens(sources.projectSelected),
            )}{' '}
            tok · no project: ~
            {harnessUtils.formatTokens(
              harnessUtils.estimateTokens(sources.noProject),
            )}{' '}
            tok
          </p>
        </>
      )}
    </div>
  );
}

const STATUS_BADGE: Record<
  HarnessScorecardRow['status'],
  { label: string; variant: 'success' | 'secondary' | 'destructive' }
> = {
  implemented: { label: 'Implemented', variant: 'success' },
  partial: { label: 'Partial', variant: 'secondary' },
  gap: { label: 'Gap', variant: 'destructive' },
};

export function ScorecardPanel() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Our harness vs. 2024–2026 agent best practices. Gaps and partials are
        the improvement backlog.
      </p>
      {harnessUtils.scorecard.map((row) => {
        const badge = STATUS_BADGE[row.status];
        return (
          <Card key={row.practice}>
            <CardContent className="flex items-start justify-between gap-4 pt-6">
              <div className="min-w-0">
                <div className="font-medium">{row.practice}</div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {row.detail}
                </p>
                <code className="mt-1 block text-xs text-muted-foreground/80">
                  {row.ref}
                </code>
              </div>
              <Badge variant={badge.variant} className="shrink-0">
                {badge.label}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
