import { MiniMap, MiniMapNodeProps } from '@xyflow/react';

import { useTheme } from '@/components/theme-provider';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { colorsUtils } from '@/lib/color-utils';
import { StepMetadata } from '@/lib/types';
import { flowStructureUtil, isNil, Step } from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

const Minimap = () => {
  const [showMinimap] = useBuilderStateContext((state) => [state.showMinimap]);
  const { theme } = useTheme();
  const maskTransparency = theme === 'dark' ? 0.8 : 0.055;
  return (
    <>
      {showMinimap && (
        <MiniMap
          position="bottom-left"
          className="!rounded-md border border-border !left-0 !ml-2 overflow-hidden !bottom-[45px] animate-in fade-in duration-300"
          zoomable
          pannable
          zoomStep={0.3}
          bgColor="var(--background)"
          maskColor={`rgba(0, 0, 0, ${maskTransparency})`}
          nodeComponent={(node) => <MinimapNode node={node} />}
        />
      )}
    </>
  );
};

const MinimapNodeContent = ({
  stepMetadata,
  node,
}: {
  stepMetadata: StepMetadata;
  node: MiniMapNodeProps;
}) => {
  const nodeColor = colorsUtils.useAverageColorInImage({
    imgUrl: stepMetadata.logoUrl ?? '',
    transparency: 50,
  });
  const defaultColor = 'oklch(92.8% 0.006 264.531)';

  return (
    <rect
      width={node.width}
      key={node.id}
      height={node.height}
      x={node.x}
      y={node.y}
      fill={nodeColor ?? defaultColor}
    ></rect>
  );
};

const MinimapContentGuard = ({
  step,
  node,
}: {
  step: Step;
  node: MiniMapNodeProps;
}) => {
  const { stepMetadata } = stepsHooks.useStepMetadata({
    step,
  });
  if (isNil(stepMetadata)) {
    return null;
  }
  return <MinimapNodeContent stepMetadata={stepMetadata} node={node} />;
};

const MinimapNode = ({ node }: { node: MiniMapNodeProps }) => {
  const [trigger] = useBuilderStateContext((state) => [
    state.flowVersion.trigger,
  ]);
  const step = flowStructureUtil.getStep(node.id, trigger);
  if (isNil(step)) {
    return null;
  }

  return <MinimapContentGuard step={step} node={node} />;
};
export default Minimap;
