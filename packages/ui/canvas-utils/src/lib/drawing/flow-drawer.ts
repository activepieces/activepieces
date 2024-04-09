import {
  Action,
  ActionType,
  StepLocationRelativeToParent,
  flowHelper,
  isNil,
} from '@activepieces/shared';
import { Trigger } from '@activepieces/shared';
import {
  VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
  FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING,
  FLOW_ITEM_WIDTH,
  PositionButton,
  PositionLabel,
} from './draw-common';
import { SvgDrawer, drawLineComponentWithButton } from './svg-drawer';
import { PositionedStep } from './step-card';
import { BranchDrawer } from './branch-drawer';
import { LoopDrawer } from './loop-drawer';

export class FlowDrawer {
  readonly steps: readonly PositionedStep[];
  readonly svg: SvgDrawer;
  readonly buttons: readonly PositionButton[];
  readonly labels: readonly PositionLabel[];
  static trigger: Trigger;
  static centerBottomOfFlowItemUi = new PositionedStep({
    x: 0,
    y: 0,
    content: null,
  }).center('bottom');
  private constructor({
    svg = SvgDrawer.empty(),
    steps = [],
    buttons = [],
    labels = [],
  }: {
    svg: SvgDrawer;
    steps: readonly PositionedStep[];
    buttons: readonly PositionButton[];
    labels: readonly PositionLabel[];
  }) {
    this.svg = svg;
    this.steps = steps;
    this.buttons = buttons;
    this.labels = labels;
  }

  appendSvg(svg: SvgDrawer): FlowDrawer {
    return new FlowDrawer({
      buttons: [...this.buttons],
      svg: this.svg.merge(svg),
      steps: [...this.steps],
      labels: [...this.labels],
    });
  }

  appendLabel(label: PositionLabel): FlowDrawer {
    return new FlowDrawer({
      buttons: [...this.buttons],
      svg: this.svg,
      steps: [...this.steps],
      labels: [
        ...this.labels,
        {
          ...label,
          // TODO - this is a hack to make the label appear in the center of the step
          x: label.x - this.getLabelWidth(label.label) / 2.0,
        },
      ],
    });
  }
  private getLabelWidth(label: string): number {
    const container = document.createElement('canvas');
    const context = container.getContext('2d');
    if (context) {
      context.font = window
        .getComputedStyle(document.body)
        .getPropertyValue('font');
      const width = context.measureText(label).width;
      container.remove();
      return width;
    }
    // for browsers that don't support canvas 2d context
    const fontSize = parseFloat(
      window.getComputedStyle(document.body).getPropertyValue('font-size')
    );
    return fontSize * 0.45 * label.length;
  }
  appendButton(button: PositionButton): FlowDrawer {
    return new FlowDrawer({
      buttons: [...this.buttons, button],
      svg: this.svg,
      steps: [...this.steps],
      labels: [...this.labels],
    });
  }

  mergeChild(child: FlowDrawer): FlowDrawer {
    return new FlowDrawer({
      buttons: [...this.buttons, ...child.buttons],
      svg: this.svg.merge(child.svg),
      steps: [...this.steps, ...child.steps],
      labels: [...this.labels, ...child.labels],
    });
  }

  boundingBox(): {
    width: number;
    height: number;
    leftSide: number;
    rightSide: number;
  } {
    if (this.steps.length === 0) {
      return {
        width: 0,
        height: 0,
        leftSide: 0,
        rightSide: 0,
      };
    }
    const minX = this.steps.reduce(
      (min, positionedStep) => Math.min(min, positionedStep.x),
      this.steps[0].x
    );
    const minY = this.steps.reduce(
      (min, positionedStep) => Math.min(min, positionedStep.y),
      this.steps[0].y
    );
    const maxX = this.steps.reduce(
      (max, positionedStep) =>
        Math.max(max, positionedStep.x + FLOW_ITEM_WIDTH),
      this.steps[0].x + FLOW_ITEM_WIDTH
    );
    const maxY = this.steps.reduce(
      (max, positionedStep) =>
        Math.max(max, positionedStep.y + FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING),
      this.steps[0].y + FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING
    );
    return {
      width:
        Math.max(maxX, this.svg.maximumX()) -
        Math.min(minX, this.svg.minimumX()),
      height:
        Math.max(maxY, this.svg.maximumY()) -
        Math.min(minY, this.svg.minimumY()),
      leftSide: Math.min(minX, this.svg.minimumX()) - FLOW_ITEM_WIDTH / 2.0,
      rightSide: Math.max(maxX, this.svg.maximumX()) - FLOW_ITEM_WIDTH / 2.0,
    };
  }

  offset(x: number, y: number): FlowDrawer {
    return new FlowDrawer({
      buttons: this.buttons.map((button) => ({
        ...button,
        x: button.x + x,
        y: button.y + y,
      })),
      labels: this.labels.map((label) => ({
        ...label,
        x: label.x + x,
        y: label.y + y,
      })),
      svg: this.svg.offset(x, y),
      steps: this.steps.map(
        (step) =>
          new PositionedStep({
            ...step,
            x: step.x + x,
            y: step.y + y,
          })
      ),
    });
  }

  static construct(step: Action | Trigger | undefined): FlowDrawer {
    if (isNil(step)) {
      return new FlowDrawer({
        buttons: [],
        svg: SvgDrawer.empty(),
        labels: [],
        steps: [
          new PositionedStep({
            x: 0,
            y: 0,
            content: null,
          }),
        ],
      });
    }
    const currentPositionedStep = new PositionedStep({
      x: 0,
      y: 0,
      content: step,
    });
    let flowDrawer = new FlowDrawer({
      buttons: [],
      labels: [],
      svg: SvgDrawer.empty(),
      steps: [currentPositionedStep],
    });
    const centerBottomOfCurrentStep = currentPositionedStep.center('bottom');
    let childHeight = 0;
    switch (step.type) {
      case ActionType.LOOP_ON_ITEMS: {
        const loopDrawer = LoopDrawer.handleLoopAction(step);
        childHeight =
          loopDrawer.boundingBox().height +
          FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING;
        flowDrawer = flowDrawer.mergeChild(loopDrawer);
        break;
      }
      case ActionType.BRANCH: {
        const branchDrawer = BranchDrawer.handleBranchAction(step);
        childHeight = branchDrawer.boundingBox().height;
        flowDrawer = flowDrawer.mergeChild(branchDrawer);
        break;
      }

      default: {
        const { line, button } = drawLineComponentWithButton({
          from: centerBottomOfCurrentStep,
          to: {
            x: centerBottomOfCurrentStep.x,
            y:
              centerBottomOfCurrentStep.y +
              VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS,
          },
          stepName: step.name,
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
          btnType: 'small',
          drawArrow: !flowHelper.isStepLastChildOfParent(
            step,
            FlowDrawer.trigger
          ),
          lineHasLabel: false,
        });
        childHeight =
          FLOW_ITEM_HEIGHT_WITH_BOTTOM_PADDING +
          VERTICAL_SPACE_BETWEEN_SEQUENTIAL_STEPS;
        flowDrawer = flowDrawer.appendButton(button).appendSvg(line);
        break;
      }
    }

    if (step.nextAction) {
      const nextFlowDrawer = FlowDrawer.construct(step.nextAction).offset(
        0,
        childHeight
      );
      flowDrawer = flowDrawer.mergeChild(nextFlowDrawer);
    }
    return flowDrawer;
  }
}
