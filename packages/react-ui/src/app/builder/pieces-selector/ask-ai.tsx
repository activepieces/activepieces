import { t } from 'i18next';
import { Sparkle } from 'lucide-react';

import { platformHooks } from '@/hooks/platform-hooks';

import { Button, ButtonProps } from '../../../components/ui/button';
import { AskAiButtonOperations } from '../../../features/pieces/lib/types';
import { useBuilderStateContext } from '../builder-hooks';

const AskAiButton = ({
  onClick,
  operation,
  varitant,
}: {
  onClick: () => void;
  operation: AskAiButtonOperations;
  varitant: ButtonProps['variant'];
}) => {
  const isCopilotEnabled = platformHooks.isCopilotEnabled();

  const setAskAiButtonProps = useBuilderStateContext(
    (state) => state.setAskAiButtonProps,
  );
  if (!isCopilotEnabled) {
    return <></>;
  }
  return (
    <Button
      variant={varitant}
      size="sm"
      onClick={() => {
        setAskAiButtonProps(operation);
        onClick();
      }}
    >
      <div className="flex gap-2 items-center ">
        <Sparkle className="w-4 h-4 "></Sparkle> {t('Ask AI')}
      </div>
    </Button>
  );
};

AskAiButton.displayName = 'AskAiButton';
export { AskAiButton };
