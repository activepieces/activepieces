import { Sparkles } from 'lucide-react';

import {
  FlowOperationType,
  StepLocationRelativeToParent,
} from '@activepieces/shared';

import { BuilderState } from '../../builder-hooks';
import { ApButtonData } from '../utils/types';

export const shouldShowAskAiIndicator = (
  state: BuilderState,
  buttonData: ApButtonData,
) =>
  state.askAiButtonProps &&
  state.askAiButtonProps.type === FlowOperationType.ADD_ACTION &&
  state.askAiButtonProps.actionLocation.stepLocationRelativeToParent ===
    buttonData.stepLocationRelativeToParent &&
  state.askAiButtonProps.actionLocation.parentStep ===
    buttonData.parentStepName &&
  (buttonData.stepLocationRelativeToParent !==
    StepLocationRelativeToParent.INSIDE_BRANCH ||
    state.askAiButtonProps.actionLocation.stepLocationRelativeToParent !==
      StepLocationRelativeToParent.INSIDE_BRANCH ||
    buttonData.branchIndex ===
      state.askAiButtonProps.actionLocation.branchIndex);

const AskAiIndicator = ({
  height,
  width,
}: {
  height: number;
  width: number;
}) => {
  return (
    <div
      style={{
        width: width + 'px',
        height: height + 'px',
      }}
      className="transition-all animate-ask-ai-background bg-[length:400%] shadow-add-button bg-gradient-to-r  from-primary/90  via-primary/55 to-primary/90 flex items-center  justify-center  rounded-xss"
    >
      <Sparkles
        className="stroke-background/80  "
        style={{
          height: `${height * 0.75}px`,
          width: `${width * 0.75}px`,
        }}
      ></Sparkles>
    </div>
  );
};
AskAiIndicator.displayName = 'AskAiIndicator';
export { AskAiIndicator };
