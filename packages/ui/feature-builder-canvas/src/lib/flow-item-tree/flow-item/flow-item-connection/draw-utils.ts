export class Drawer {
  drawVerticalLine(dy: number) {
    return `v ${dy}`;
  }
  drawHorizontalLine(dx: number) {
    return `h ${dx}`;
  }

  drawLine(dx: number, dy: number) {
    return `l ${dx} ${dy}`;
  }

  drawArc(isLeft: boolean, isDownwards: boolean, shouldSweep: boolean) {
    const sweepFlag = shouldSweep ? '0' : '1';
    const xSign = isLeft ? '-' : '';
    const ySign = isDownwards ? '' : '-';
    return `a ${ARC_LENGTH} ${ARC_LENGTH} 0 0 ${sweepFlag} ${xSign}${ARC_LENGTH} ${ySign}${ARC_LENGTH}`;
  }
  move(dx: number, dy: number) {
    return `m ${dx} ${dy}`;
  }
}

export const VERTICAL_LINE_LENGTH = 48 * 1.25;
export const ADD_BUTTON_SIZE = { width: 16, height: 16 };
export const ARROW_HEAD_SIZE = { width: 13, height: 8 };
export const FLOW_ITEM_WIDTH = 300;
export const HORZIONTAL_LINE_LENGTH = 180;
export const FLOW_ITEM_HEIGHT = 92;
export const ARC_LENGTH = 15;
export const EMPTY_LOOP_ADD_BUTTON_WIDTH = 40;
export const EMPTY_LOOP_ADD_BUTTON_HEIGHT = 40;
export const SVG_ELEMENT_DEFAULT_HEIGHT = 150;
export const SVG_ELEMENT_DEFAULT_WIDTH = 300;
export const LINES_WIDTH = 2;
export const SPACE_BETWEEN_ITEM_CONTENT_AND_LINE = 8;
export const AFTER_NESTED_LOOP_LINE_LENGTH =
  VERTICAL_LINE_LENGTH + ARROW_HEAD_SIZE.height;
export const DROP_ZONE_WIDTH = 300;
export const DROP_ZONE_HEIGHT = 125;
