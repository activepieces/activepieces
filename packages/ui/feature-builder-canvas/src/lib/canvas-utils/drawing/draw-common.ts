import { StepLocationRelativeToParent } from '@activepieces/shared';

export type PositionButton = {
  x: number;
  y: number;
  type: 'big' | 'small';
  stepName: string;
  stepLocationRelativeToParent: StepLocationRelativeToParent;
};

export const FLOW_ITEM_WIDTH = 300;
export const FLOW_ITEM_HEIGHT = 92;
export const FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING = FLOW_ITEM_HEIGHT + 16;
export const FLOW_ITEM_BOTTOM_PADDING = 16;
export const SPACE_BETWEEN_VERTICAL_STEP = 80;
export const SPACE_BETWEEN_VERTICAL_LONG_STEP = 120;
export const SPACE_BETWEEN_VERTICAL_ARROW_LINE_HEIGHT = 70;
export const SPACE_BETWEEN_TWO_BRANCH = 60;
export const SPACE_ON_EMPTY_LOOP_SIDE_HORZINTAL = 120;
export const ARC_LENGTH = 15;
export const EMPTY_LOOP_ADD_BUTTON_WIDTH = 40;
export const EMPTY_LOOP_ADD_BUTTON_HEIGHT = 40;
export const SPACE_BETWEEN_BUTTON_AND_ARROW = 40;
export const BUTTON_SIZE = 18;
export const DROP_ZONE_WIDTH = 300;
export const DROP_ZONE_HEIGHT = 125;
