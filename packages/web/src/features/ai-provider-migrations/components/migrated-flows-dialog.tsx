import { FlowMigration, PieceVersionChange } from '@activepieces/shared';
import { t } from 'i18next';
import { CheckCircle2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { FlowLink, ProjectGroupedFlowList } from './project-grouped-flow-list';

type MigratedVersion = FlowMigration['migratedVersions'][number];

export function MigratedFlowsDialog({
  open,
  onOpenChange,
  migratedVersions,
  isDryCheck = false,
}: MigratedFlowsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isDryCheck ? t('Planned Migrations') : t('Migrated Flows')}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <MigratedFlowsDialogContent
            migratedVersions={migratedVersions}
            isDryCheck={isDryCheck}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function MigratedFlowsDialogContent({
  migratedVersions,
  isDryCheck,
}: {
  migratedVersions: MigratedVersion[];
  isDryCheck: boolean;
}) {
  return (
    <ProjectGroupedFlowList
      entries={migratedVersions}
      renderRow={({ flowId, entries, displayName, projectId }) => {
        const migrationSummary = summarizeMigratedVersionsForFlow(entries);
        const detailLines = buildFlowMigrationDetailLines({
          summary: migrationSummary,
          isDryCheck,
        });
        return (
          <li
            key={flowId}
            className="flex items-start gap-3 rounded-md border p-3"
          >
            <CheckCircle2 className="size-4 shrink-0 text-success mt-0.5" />
            <div className="flex flex-col gap-1 min-w-0">
              <FlowLink
                projectId={projectId}
                flowId={flowId}
                displayName={displayName}
              />
              {detailLines.map((line, idx) => (
                <p key={idx} className="text-xs text-muted-foreground">
                  {line}
                </p>
              ))}
            </div>
          </li>
        );
      }}
    />
  );
}

function summarizeMigratedVersionsForFlow(
  versions: MigratedVersion[],
): FlowMigrationSummary {
  const changesByKey = new Map<string, PieceVersionChange>();
  let draftMigrated = false;
  let publishedMigrated = false;
  let clearedAdvancedOptions = false;
  let disabledWebSearch = false;

  for (const version of versions) {
    if (version.draft) draftMigrated = true;
    else publishedMigrated = true;
    for (const change of version.pieceVersionChanges ?? []) {
      const key = `${change.from}→${change.to}`;
      if (!changesByKey.has(key)) changesByKey.set(key, change);
    }
    if (version.changedFields?.clearedAdvancedOptions) {
      clearedAdvancedOptions = true;
    }
    if (version.changedFields?.disabledWebSearch) {
      disabledWebSearch = true;
    }
  }

  return {
    draftMigrated,
    publishedMigrated,
    pieceVersionChanges: [...changesByKey.values()],
    clearedAdvancedOptions,
    disabledWebSearch,
  };
}

function buildFlowMigrationDetailLines({
  summary,
  isDryCheck,
}: {
  summary: FlowMigrationSummary;
  isDryCheck: boolean;
}): string[] {
  const lines: string[] = [
    formatDraftPublishedMigrationMessage({ summary, isDryCheck }),
  ];
  for (const change of summary.pieceVersionChanges) {
    if (change.from !== change.to) {
      lines.push(
        t('Piece upgraded {from} → {to}', {
          from: change.from,
          to: change.to,
        }),
      );
    }
  }
  if (summary.clearedAdvancedOptions) {
    lines.push(
      t(
        'Some image generation step settings that depend on the provider/model (e.g. size, quality, background) will be reset to their defaults',
      ),
    );
  }
  if (summary.disabledWebSearch) {
    lines.push(
      t('Web search turned off (target provider does not support it)'),
    );
  }
  return lines;
}

function formatDraftPublishedMigrationMessage({
  summary,
  isDryCheck,
}: {
  summary: FlowMigrationSummary;
  isDryCheck: boolean;
}): string {
  const both = summary.draftMigrated && summary.publishedMigrated;
  const publishedOnly = !summary.draftMigrated && summary.publishedMigrated;
  if (isDryCheck) {
    if (both) return t('Both draft and published versions will be migrated.');
    if (publishedOnly) return t('Published version will be migrated.');
    return t('Draft version will be migrated.');
  }
  if (both) return t('Both draft and published versions were migrated.');
  if (publishedOnly) return t('Published version was migrated.');
  return t('Draft version was migrated.');
}

type FlowMigrationSummary = {
  draftMigrated: boolean;
  publishedMigrated: boolean;
  pieceVersionChanges: PieceVersionChange[];
  clearedAdvancedOptions: boolean;
  disabledWebSearch: boolean;
};

type MigratedFlowsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  migratedVersions: MigratedVersion[];
  isDryCheck?: boolean;
};
