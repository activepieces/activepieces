import { PieceSet, ProjectWithLimits } from '@activepieces/shared';
import { t } from 'i18next';
import { Info } from 'lucide-react';

import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { pieceSetTerms, projectPieceSet } from '@/features/piece-sets';

export function ProjectPieceSetCell({
  project,
  pieceSets,
  showEmbedNote,
}: {
  project: ProjectWithLimits;
  pieceSets: PieceSet[];
  showEmbedNote: boolean;
}) {
  const currentId = projectPieceSet.currentSetId({
    pieceSetId: project.pieceSetId,
    pieceSets,
  });
  const name = pieceSets.find((set) => set.id === currentId)?.name ?? '—';
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <TextWithTooltip tooltipMessage={name}>
        <span className="min-w-0 truncate text-sm text-gray-12">{name}</span>
      </TextWithTooltip>
      {showEmbedNote && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-sm text-gray-11 focus-visible:outline-2 focus-visible:outline-accent-8"
              aria-label={t('Set by the embed token')}
              onClick={(event) => event.stopPropagation()}
            >
              <Info className="size-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-64">
            {t(
              'This project is embedded: the embed token sets its {term} at each sign-in, so a manual change lasts until the next sign-in.',
              pieceSetTerms.get(),
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
