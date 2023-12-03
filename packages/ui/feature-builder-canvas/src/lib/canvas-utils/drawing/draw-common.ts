import { StepLocationRelativeToParent } from '@activepieces/shared';

export type PositionButton = {
  x: number;
  y: number;
  type: ButtonType;
  stepName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
};

export const FLOW_ITEM_WIDTH = 300;
export const FLOW_ITEM_HEIGHT = 92;
export const FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING = FLOW_ITEM_HEIGHT + 16;
export const FLOW_ITEM_BOTTOM_PADDING = 16;
/**Sequential as in one step comes after the other, i.e (s1).next === (s2) */
export const VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS = 80;
export const VERTICAL_SPACE_BETWEEN_STEP_AND_CHILD = 120;
export const HORIZONTAL_SPACE_BETWEEN_BRANCHES = 60;
export const HORIZONTAL_SPACE_FOR_EMPTY_SIDE_OF_LOOP = 120;
export const ARC_LENGTH = 15;
export const SPACE_BETWEEN_BUTTON_AND_ARROW = 40;
export const BIG_BUTTON_SIZE = 40;
export const BUTTON_SIZE = 18;
export const DROP_ZONE_WIDTH = 300;
export const DROP_ZONE_HEIGHT = 125;
export type ButtonType = 'big' | 'small';
