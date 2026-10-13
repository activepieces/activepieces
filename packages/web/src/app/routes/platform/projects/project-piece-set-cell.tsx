import { PieceSet, ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-react';

import { useAdminAction } from '@/app/components/admin';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PieceSetSelect,
  pieceSetTerms,
  projectPieceSet,
  usePieceSetProjectMoves,
} from '@/features/piece-sets';

export function ProjectPieceSetCell({
  project,
  pieceSets,
  showEmbedNote,
}: {
  project: ProjectWithLimits;
  pieceSets: PieceSet[];
  showEmbedNote: boolean;
}) {
  const moveProjects = usePieceSetProjectMoves();
  const current = projectPieceSet.currentSetId({
    pieceSetId: project.pieceSetId,
    pieceSets,
  });
  const moveProject = useAdminAction<string>({
    verb: 'update',
    name: project.displayName,
    run: (toSetId) =>
      moveProjects({
        pieceSetId: toSetId,
        added: [project.id],
        removed: [],
        defaultSetId: undefined,
      }),
  });

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <PieceSetSelect
        value={current}
        pieceSets={pieceSets}
        disabled={moveProject.isPending || pieceSets.length === 0}
        onValueChange={(next) => {
          if (next !== current) {
            moveProject.mutate(next);
          }
        }}
        className="h-8 w-44"
        aria-label={t('{Term} for {name}', {
          ...pieceSetTerms.get(),
          name: project.displayName,
        })}
      />
      {showEmbedNote && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-sm text-gray-11 focus-visible:outline-2 focus-visible:outline-accent-8"
              aria-label={t('Set by the embed token')}
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            {t(
              'This project is embedded: the embed token sets its {term} at each sign-in, so a change here lasts until the next sign-in.',
              pieceSetTerms.get(),
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
