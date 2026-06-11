import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasConsts } from '../utils/consts';
import { svgPathUtils } from '../utils/svg-path-utils';

/**
 * How the horizontal canvas works for edges: all edge geometry is written once
 * against the vertical canvas, in "layout space" (the flow advances along y and
 * branches spread along x). In horizontal mode the graph builder transposes
 * every node position across the y = x axis, so edges keep working unchanged by
 * mapping their endpoints back into layout space, generating the same vertical
 * path, and transposing the resulting SVG path into canvas space again.
 */
export function useEdgeLayoutSpace({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}) {
  const canvasOrientation = useBuilderStateContext(
    (state) => state.canvasOrientation,
  );
  const isHorizontal = canvasOrientation === 'horizontal';
  return {
    isHorizontal,
    layout: flowCanvasConsts.ORIENTATION_LAYOUT[canvasOrientation],
    layoutSource: isHorizontal
      ? { x: sourceY, y: sourceX }
      : { x: sourceX, y: sourceY },
    layoutTarget: isHorizontal
      ? { x: targetY, y: targetX }
      : { x: targetX, y: targetY },
    toCanvasPath: (layoutPath: string) =>
      isHorizontal ? svgPathUtils.transposePath(layoutPath) : layoutPath,
  };
}
