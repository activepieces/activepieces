import { useBuilderStateContext } from '@/app/builder/builder-hooks';

import { flowCanvasConsts } from '../../utils/consts';

const StepNodeName = ({ stepName }: { stepName: string }) => {
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  if (canvasOrientation === 'horizontal') {
    return (
      <div className="text-accent-foreground/80 text-xs text-center opacity-0 transition-all duration-300 group-hover:opacity-100">
        {stepName}
      </div>
    );
  }
  return (
    <div
      className="absolute left-full bg-builder-background ml-3 text-accent-foreground text-xs opacity-0 transition-all duration-300 group-hover:opacity-100"
      style={{
        top: `${flowCanvasConsts.AP_NODE_SIZE.STEP.height / 2 - 12}px`,
      }}
    >
      {stepName}
    </div>
  );
};

export { StepNodeName };
