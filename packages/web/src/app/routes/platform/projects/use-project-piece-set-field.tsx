import {
  PieceSet,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { FormDescription } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  PieceSetSelect,
  pieceSetKeys,
  pieceSetTerms,
  projectPieceSet,
  useShowEmbedKey,
} from '@/features/piece-sets';
import { PieceSetField, projectCollectionUtils } from '@/features/projects';
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
  const queryClient = useQueryClient();
  const showEmbedNote = useShowEmbedKey() && !!project?.externalId;
  if (
    project === undefined ||
    pieceSets === undefined ||
    !platform.plan.managePiecesEnabled ||
    platformRole !== PlatformRole.ADMIN
  ) {
    return undefined;
  }
  const initialValue = projectPieceSet.currentSetId({
    pieceSetId: project.pieceSetId,
    pieceSets,
  });
  return {
    initialValue,
    render: ({ value, onChange, disabled }) => (
      <>
        <Label htmlFor="pieceSetId">{pieceSetTerms.get().titleSingular}</Label>
        <FormDescription>
          {showEmbedNote
            ? t(
                'This project is embedded: the embed token sets its {term} at each sign-in, so a change here lasts until the next sign-in.',
                pieceSetTerms.get(),
              )
            : t('Decides which pieces builders in this project see.')}
        </FormDescription>
        <PieceSetSelect
          value={value}
          onValueChange={onChange}
          pieceSets={pieceSets}
          disabled={disabled}
          className="w-full"
          aria-label={pieceSetTerms.get().titleSingular}
        />
      </>
    ),
    save: async (toSetId) => {
      await projectPieceSet.move({
        projectId: project.id,
        fromSetId: initialValue,
        toSetId,
        pieceSets,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all }),
        projectCollectionUtils.refetchProjects(),
      ]);
    },
  };
}
