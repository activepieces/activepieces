import { t } from 'i18next';
import { Sparkle } from 'lucide-react';

import { ApFlagId } from '@activepieces/shared';

import { Button, ButtonProps } from '../../../components/ui/button';
import { AskAiButtonOperations } from '../../../features/pieces/lib/types';
import { flagsHooks } from '../../../hooks/flags-hooks';
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
  const { data: isCopilotEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.CODE_COPILOT_ENABLED,
  );
  const setAskiAiButtonProps = useBuilderStateContext(
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
        console.log(operation);
        setAskiAiButtonProps(operation);
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
