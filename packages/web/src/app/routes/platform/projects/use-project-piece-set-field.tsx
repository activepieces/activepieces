import {
  PieceSet,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';

import { FormControl, FormDescription, FormLabel } from '@/components/ui/form';
import {
  PieceSetSelect,
  pieceSetTerms,
  projectPieceSet,
  usePieceSetProjectMoves,
  useShowEmbedKey,
} from '@/features/piece-sets';
import { PieceSetField } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';

export function useProjectPieceSetField({
  project,
  pieceSets,
}: {
  project: ProjectWithLimits | undefined;
  pieceSets: PieceSet[] | undefined;
}): PieceSetField | undefined {
  const { platform } = platformHooks.useCurrentPlatform();
  const platformRole = userHooks.getCurrentUserPlatformRole();
  const moveProjects = usePieceSetProjectMoves();
  const showEmbedNote = useShowEmbedKey() && !!project?.externalId;
  if (
    project === undefined ||
    !platform.plan.managePiecesEnabled ||
    platformRole !== PlatformRole.ADMIN
  ) {
    return undefined;
  }
  if (pieceSets === undefined) {
    return { isLoading: true };
  }
  const initialValue = projectPieceSet.currentSetId({
    pieceSetId: project.pieceSetId,
    pieceSets,
  });
  return {
    isLoading: false,
    initialValue,
    render: ({ value, onChange, disabled }) => (
      <>
        <FormLabel>{pieceSetTerms.get().titleSingular}</FormLabel>
        <FormDescription>
          {showEmbedNote
            ? t(
                'This project is embedded: the embed token sets its {term} at each sign-in, so a change here lasts until the next sign-in.',
                pieceSetTerms.get(),
              )
            : t('Decides which pieces builders in this project see.')}
        </FormDescription>
        <FormControl>
          <PieceSetSelect
            value={value}
            onValueChange={onChange}
            pieceSets={pieceSets}
            disabled={disabled}
            className="w-full"
          />
        </FormControl>
      </>
    ),
    save: (toSetId) =>
      moveProjects({
        pieceSetId: toSetId,
        added: [project.id],
        removed: [],
        defaultSetId: undefined,
      }),
  };
}
