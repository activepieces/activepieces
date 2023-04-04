import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import {
  ADD_BUTTON_SIZE,
  ARC_LENGTH,
  ARROW_HEAD_SIZE,
  Drawer,
  EMPTY_LOOP_ADD_BUTTON_HEIGHT,
  FLOW_ITEM_HEIGHT,
  FLOW_ITEM_WIDTH,
  HORZIONTAL_LINE_LENGTH,
  SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
  VERTICAL_LINE_LENGTH,
  EMPTY_LOOP_ADD_BUTTON_WIDTH,
} from '../draw-utils';
import { Observable } from 'rxjs';
import {
  BranchAction,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import {
  AddButtonAndFlowItemNameContainer,
  FlowItem,
  FlowItemRenderInfo,
  FlowRendererService,
  FlowsActions,
  RightSideBarType,
} from '@activepieces/ui/feature-builder-store';
import { FlowRenderUtil } from '../../../../../../../feature-builder-store/src/lib/utils/flowRenderUtil';

@Component({
  selector: 'app-branch-line-connection',
  templateUrl: './branch-line-connection.component.html',
  styleUrls: ['./branch-line-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchLineConnectionComponent implements OnChanges, OnInit {
  @Input() insideLoopOrBranch = false;
  afterLoopArrowCommand = '';
  trueBranchLineDrawCommand = '';
  falseBranchLineDrawCommand = '';
  arrowHeadLeftFalseBranch = 0;
  arrowHeadLeftTrueBranch = 0;
  arrowHeadTop = 0;
  drawer: Drawer = new Drawer();
  addButtonAndFlowItemNameContainer: AddButtonAndFlowItemNameContainer;
  addButtonTop = '0px';
  addButtonFalseBranchLeftStyleProperty = '0px';
  addButtonTrueBranchLeftStyleProperty = '0px';
  emptyLoopAddButtonTopOffset = '0px';
  emptyLoopAddButtonLeftOffsetForFalseBranch = '0px';
  emptyLoopAddButtonLeftOffsetForTrueBranch = '0px';
  afterBranchAddButtonTop = '0px';
  afterBranchAddButtonLeft = '0px';
  afterBranchesArrowHeadLeft = 0;
  afterBranchesArrowHeadTop = 0;
  showEmptyTrueBranchAddButtonBoxShadow = false;
  showEmptyFalseranchAddButtonBoxShadow = false;
  addButtonSize = {
    width: `${ADD_BUTTON_SIZE.width}px`,
    height: `${ADD_BUTTON_SIZE.height}px`,
  };
  numberOfNestedBranches = 0;
  _flowItem: BranchAction & FlowItemRenderInfo;

  showDropArea$: Observable<boolean> = new Observable<boolean>();

  @Input() viewMode: boolean;

  @Input() set flowItem(value: BranchAction & FlowItemRenderInfo) {
    this._flowItem = value;
    this.numberOfNestedBranches = Math.max(
      FlowRenderUtil.findNumberOfNestedBranches(this._flowItem.onFailureAction),
      FlowRenderUtil.findNumberOfNestedBranches(this._flowItem.onSuccessAction)
    );
    this.writeLines();
    this.calculateOffsetBeforeFirstAction();
    this.calculateOffsetAfterBranch();
    this.calculateEmptyLoopAddButton();
  }

  get flowItem() {
    return this._flowItem;
  }

  constructor(
    private store: Store,
    private flowRendererService: FlowRendererService
  ) {
    this.showDropArea$ = this.flowRendererService.draggingSubject;
  }
  ngOnInit(): void {
    this.numberOfNestedBranches = Math.max(
      FlowRenderUtil.findNumberOfNestedBranches(this._flowItem.onFailureAction),
      FlowRenderUtil.findNumberOfNestedBranches(this._flowItem.onSuccessAction)
    );
    this.writeLines();
    this.calculateOffsetBeforeFirstAction();
    this.calculateOffsetAfterBranch();
    this.calculateEmptyLoopAddButton();
  }

  writeLines() {
    const trueBranchCommands: string[] = [];
    const trueBranchGraphHeight = this._flowItem.onSuccessAction
      ? (this._flowItem.onSuccessAction as FlowItem).boundingBox!.height
      : this.viewMode
      ? -SPACE_BETWEEN_ITEM_CONTENT_AND_LINE
      : EMPTY_LOOP_ADD_BUTTON_HEIGHT + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
    const falseBranchGraphHeight = this._flowItem.onFailureAction
      ? (this._flowItem.onFailureAction as FlowItem).boundingBox!.height
      : this.viewMode
      ? -SPACE_BETWEEN_ITEM_CONTENT_AND_LINE
      : EMPTY_LOOP_ADD_BUTTON_HEIGHT + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
    const branchesHeightDifference = Math.abs(
      trueBranchGraphHeight - falseBranchGraphHeight
    );
    trueBranchCommands.push(
      ...this.writeBranchLine(
        true,
        trueBranchGraphHeight,
        branchesHeightDifference,
        trueBranchGraphHeight > falseBranchGraphHeight
      )
    );
    trueBranchCommands.push(...this.writeBranchClosing(true));
    this.trueBranchLineDrawCommand = trueBranchCommands.join(' ');

    const falseBranchCommands: string[] = [];
    falseBranchCommands.push(
      ...this.writeBranchLine(
        false,
        falseBranchGraphHeight,
        branchesHeightDifference,
        falseBranchGraphHeight > trueBranchGraphHeight
      )
    );
    falseBranchCommands.push(...this.writeBranchClosing(false));
    falseBranchCommands.push(
      ...[
        this.drawer.move(3, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE),
        this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH),
      ]
    );
    this.falseBranchLineDrawCommand = falseBranchCommands.join(' ');
  }

  writeBranchLine(
    trueBranch: boolean,
    branchGraphHeight: number,
    differenceBetweenBranchesHeights: number,
    isLongerGraph: boolean
  ) {
    const commands: string[] = [];
    commands.push(
      this.drawer.move(FLOW_ITEM_WIDTH / 2, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
    );
    commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
    commands.push(this.drawer.drawArc(trueBranch, true, !trueBranch));
    commands.push(
      this.drawer.drawHorizontalLine(
        (HORZIONTAL_LINE_LENGTH +
          this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH / 2)) *
          (trueBranch ? -1 : 1)
      )
    );
    commands.push(this.drawer.drawArc(trueBranch, true, trueBranch));
    commands.push(
      this.drawer.drawVerticalLine(
        VERTICAL_LINE_LENGTH + VERTICAL_LINE_LENGTH * 0.25
      )
    );
    commands.push(this.drawer.move(0, branchGraphHeight));
    commands.push(this.drawer.move(0, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
    commands.push(
      this.drawer.drawVerticalLine(
        VERTICAL_LINE_LENGTH +
          (isLongerGraph ? 0 : differenceBetweenBranchesHeights)
      )
    );
    return commands;
  }

  writeBranchClosing(isTrueBranch: boolean) {
    const commands: string[] = [];
    commands.push(this.drawer.drawArc(!isTrueBranch, true, isTrueBranch));
    commands.push(
      this.drawer.drawHorizontalLine(
        (1.1 * HORZIONTAL_LINE_LENGTH +
          this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH / 2)) *
          (isTrueBranch ? 1 : -1)
      )
    );
    return commands;
  }

  calculateEmptyLoopAddButton() {
    const leftOffset =
      HORZIONTAL_LINE_LENGTH +
      11 +
      this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH / 2);
    const topOffset =
      VERTICAL_LINE_LENGTH * 2.25 +
      ARC_LENGTH * 2 +
      2 * SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
    this.emptyLoopAddButtonTopOffset = `${topOffset}px`;
    this.emptyLoopAddButtonLeftOffsetForFalseBranch = `calc(50% + ${leftOffset}px)`;
    this.emptyLoopAddButtonLeftOffsetForTrueBranch = `calc(50% - ${
      leftOffset + EMPTY_LOOP_ADD_BUTTON_WIDTH
    }px)`;
  }

  calculateOffsetBeforeFirstAction() {
    const lineStrokeOffset = 1.5;
    const leftOffset =
      FLOW_ITEM_WIDTH / 2 +
      ARC_LENGTH +
      HORZIONTAL_LINE_LENGTH +
      ARC_LENGTH +
      this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH / 2);
    const rightOffset =
      FLOW_ITEM_WIDTH / 2 -
      ARC_LENGTH -
      HORZIONTAL_LINE_LENGTH -
      ARC_LENGTH -
      this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH / 2);
    const topOffset =
      VERTICAL_LINE_LENGTH +
      ARC_LENGTH +
      ARC_LENGTH +
      VERTICAL_LINE_LENGTH -
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
    this.arrowHeadLeftTrueBranch =
      rightOffset - (ARROW_HEAD_SIZE.width / 2.0 + lineStrokeOffset);
    this.arrowHeadLeftFalseBranch =
      leftOffset - (ARROW_HEAD_SIZE.width / 2.0 + lineStrokeOffset);
    this.arrowHeadTop =
      topOffset + VERTICAL_LINE_LENGTH / 2.0 - ARROW_HEAD_SIZE.height;

    this.addButtonFalseBranchLeftStyleProperty =
      leftOffset - Math.floor(ADD_BUTTON_SIZE.width / 2.0) + 'px';
    this.addButtonTrueBranchLeftStyleProperty =
      rightOffset - Math.floor(ADD_BUTTON_SIZE.width / 2.0) + 'px';
    this.addButtonTop = topOffset - VERTICAL_LINE_LENGTH / 2.0 + 25 + 'px';
  }

  calculateOffsetAfterBranch() {
    const topOffset =
      this.flowItem.connectionsBox!.height -
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE -
      (this.flowItem.nextAction ? ARROW_HEAD_SIZE.height : 0);

    this.afterBranchAddButtonTop = `${
      topOffset -
      VERTICAL_LINE_LENGTH * 0.5 -
      (this.insideLoopOrBranch ? ARROW_HEAD_SIZE.height : 1)
    }px`;
    this.afterBranchAddButtonLeft = `calc(50% - ${
      ADD_BUTTON_SIZE.width / 2 - 0.5
    }px`;
    const lineStrokeOffset = 1.5;
    this.afterBranchesArrowHeadTop =
      topOffset - ARROW_HEAD_SIZE.height - lineStrokeOffset + 5;
    this.afterBranchesArrowHeadLeft =
      this.flowItem.connectionsBox!.width / 2.0 -
      ARROW_HEAD_SIZE.width / 2 -
      lineStrokeOffset;
  }

  addTrueBranchItem() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.STEP_TYPE,
        props: {
          stepName: this.flowItem.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_TRUE_BRANCH,
        },
      })
    );
  }

  addFalseBranchItem() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.STEP_TYPE,
        props: {
          stepName: this.flowItem.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_FALSE_BRANCH,
        },
      })
    );
  }

  add() {
    this.store.dispatch(
      FlowsActions.setRightSidebar({
        sidebarType: RightSideBarType.STEP_TYPE,
        props: {
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
          stepName: this.flowItem.name,
        },
      })
    );
  }

  findReturningVerticalLineLength(subGraph: number) {
    return (
      subGraph + VERTICAL_LINE_LENGTH + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.addButtonAndFlowItemNameContainer &&
      this.flowItem.name != this.addButtonAndFlowItemNameContainer.stepName
    ) {
      const containerInArray =
        this.flowRendererService.addButtonsWithStepNamesContainers.find(
          (item) => item == this.addButtonAndFlowItemNameContainer
        );
      if (!containerInArray) {
        console.error('addButtonsWithStepNamesContainer not found');
      } else {
        this.addButtonAndFlowItemNameContainer.stepName = this.flowItem.name;
        containerInArray.stepName = this.flowItem.name;
      }
    }
  }

  falseBranchStyle() {
    return {
      width: FLOW_ITEM_WIDTH + 'px',
      height: FLOW_ITEM_HEIGHT + 'px',
      top:
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        VERTICAL_LINE_LENGTH +
        ARC_LENGTH +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH * 1.25 +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        'px',
      left:
        FLOW_ITEM_WIDTH / 2 +
        ARC_LENGTH * 2 +
        (HORZIONTAL_LINE_LENGTH +
          this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH / 2)) -
        FLOW_ITEM_WIDTH / 2 +
        'px',
      position: 'absolute',
    };
  }
  trueBranchStyle() {
    return {
      width: FLOW_ITEM_WIDTH + 'px',
      height: FLOW_ITEM_HEIGHT + 'px',
      top:
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        VERTICAL_LINE_LENGTH +
        ARC_LENGTH +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH * 1.25 +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        'px',
      left:
        (FLOW_ITEM_WIDTH / 2 +
          ARC_LENGTH * 2 +
          (HORZIONTAL_LINE_LENGTH +
            this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH / 2)) -
          FLOW_ITEM_WIDTH / 2) *
          -1 +
        'px',
      position: 'absolute',
    };
  }
}
