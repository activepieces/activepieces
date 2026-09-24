import { isNil } from '@activepieces/core-utils';
import { flowStructureUtil, Step } from '@activepieces/shared';
import { MiniMap, MiniMapNodeProps } from '@xyflow/react';

import { stepsHooks, StepMetadata } from '@/features/pieces';
import { colorsUtils } from '@/lib/color-utils';

import { useBuilderStateContext } from '../../builder-hooks';

const NODE_COLOR_STRENGTH = 72;

const Minimap = () => {
  const [showMinimap] = useBuilderStateContext((state) => [state.showMinimap]);
  return (
    <>
      {showMinimap && (
        <MiniMap
          position="bottom-left"
          className="!rounded-md border border-border !left-0 !ml-2 overflow-hidden !bottom-[45px] animate-in fade-in duration-300"
          zoomable
          pannable
          zoomStep={0.3}
          bgColor="var(--canvas)"
          maskColor="var(--canvas-mask)"
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
    strength: NODE_COLOR_STRENGTH,
  });

  return (
    <rect
      width={node.width}
      key={node.id}
      height={node.height}
      x={node.x}
      y={node.y}
      fill={nodeColor ?? 'var(--neutral-mark)'}
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
