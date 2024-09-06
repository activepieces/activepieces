import { TooltipContent } from '@radix-ui/react-tooltip';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';

type TogglePieceButtonProps = {
  pieceName: string;
};

const TogglePieceButton = ({ pieceName }: TogglePieceButtonProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const { mutate: togglePiece, isPending } = useMutation({
    mutationFn: async (piecename: string) => {
      const newFilteredPieceNames = platform.filteredPieceNames.includes(
        piecename,
      )
        ? platform.filteredPieceNames.filter((name) => name !== piecename)
        : [...platform.filteredPieceNames, piecename];

      await platformApi.update(
        {
          filteredPieceNames: newFilteredPieceNames,
        },
        platform.id,
      );
      await refetch();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const filtered = platform.filteredPieceNames.includes(pieceName);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={'sm'}
          loading={isPending}
          onClick={() => {
            togglePiece(pieceName);
          }}
        >
          {filtered ? (
            <EyeOff className="size-4" />
          ) : (
            <Eye className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {filtered
          ? t('Hide this piece from all projects')
          : t('Show this piece for all projects')}
      </TooltipContent>
    </Tooltip>
  );
};

TogglePieceButton.displayName = 'TogglePieceButton';

export { TogglePieceButton };
