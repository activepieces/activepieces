import {
  PieceSet,
  PlatformRole,
  ProjectWithLimits,
} from '@activepieces/shared';
import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import { FormControl, FormDescription, FormLabel } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
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
import { mutationFeedback } from '@/lib/mutation-feedback';

export function useProjectPieceSetField({
  project,
  pieceSets,
  isError,
  onRetry,
}: {
  project: ProjectWithLimits | undefined;
  pieceSets: PieceSet[] | undefined;
  isError: boolean;
  onRetry: () => unknown;
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
  if (pieceSets === undefined && isError) {
    return {
      status: 'error',
      render: () => (
        <div className="flex flex-col gap-2">
          <Label>{pieceSetTerms.get().titleSingular}</Label>
          <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
            <span className="text-sm text-gray-11">
              {t("Couldn't load the {terms}.", pieceSetTerms.get())}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                Promise.resolve(onRetry()).catch(() => undefined);
              }}
            >
              {t('Try again')}
            </Button>
          </div>
        </div>
      ),
    };
  }
  if (pieceSets === undefined) {
    return { status: 'loading' };
  }
  const initialValue = projectPieceSet.currentSetId({
    pieceSetId: project.pieceSetId,
    pieceSets,
  });
  return {
    status: 'ready',
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
    save: async (toSetId) => {
      await moveProjects({ pieceSetId: toSetId, added: [project.id] });
    },
    saveFailedMessage: (error) =>
      t("The project was saved, but its {term} wasn't changed: {message}", {
        ...pieceSetTerms.get(),
        message: mutationFeedback.message(error),
      }),
  };
}
