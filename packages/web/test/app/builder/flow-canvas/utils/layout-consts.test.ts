import { describe, it, expect } from 'vitest';

import { flowCanvasLayoutConsts } from '@/app/builder/flow-canvas/utils/layout-consts';

describe('flowCanvasLayoutConsts', () => {
  it('keeps horizontal step labels narrower than the node center-to-center distance so adjacent labels cannot overlap', () => {
    const { stepAlongSize, spaceAlongBetweenSteps } =
      flowCanvasLayoutConsts.ORIENTATION_LAYOUT.horizontal;
    const centerToCenterDistance = stepAlongSize + spaceAlongBetweenSteps;

    expect(flowCanvasLayoutConsts.HORIZONTAL_STEP_LABEL_WIDTH).toBeLessThan(
      centerToCenterDistance,
    );
  });
});
