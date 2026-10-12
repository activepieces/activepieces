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
  pieceSetKeys,
  pieceSetTerms,
  projectPieceSet,
  useShowEmbedKey,
} from '@/features/piece-sets';
import { projectCollectionUtils } from '@/features/projects';

export function ProjectPieceSetCell({
  project,
  pieceSets,
}: {
  project: ProjectWithLimits;
  pieceSets: PieceSet[];
}) {
  const showEmbedNote = useShowEmbedKey() && !!project.externalId;
  const current = projectPieceSet.currentSetId({
    pieceSetId: project.pieceSetId,
    pieceSets,
  });
  const moveProject = useAdminAction<string>({
    verb: 'update',
    name: project.displayName,
    run: async (toSetId) => {
      await projectPieceSet.move({
        projectId: project.id,
        fromSetId: current,
        toSetId,
        pieceSets,
      });
      await projectCollectionUtils.refetchProjects();
    },
    invalidate: [pieceSetKeys.all, ['projects-for-platforms']],
  });

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <PieceSetSelect
        value={current}
        pieceSets={pieceSets}
        disabled={moveProject.isPending || pieceSets.length === 0}
        onValueChange={(next) => moveProject.mutate(next)}
        className="h-8 w-44"
        aria-label={t('{Term} for {name}', {
          ...pieceSetTerms.get(),
          name: project.displayName,
        })}
      />
      {showEmbedNote && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Info
              className="size-4 shrink-0 text-gray-11"
              aria-label={t('Set by the embed token')}
            />
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
