import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
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
  AFTER_NESTED_LOOP_LINE_LENGTH,
  EMPTY_LOOP_ADD_BUTTON_WIDTH,
} from '../draw-utils';
import { FlowsActions } from '../../../../../../store/flow/flows.action';
import { Observable } from 'rxjs';
import {
  BranchAction,
  StepLocationRelativeToParent,
} from '@activepieces/shared';
import { AddButtonAndFlowItemNameContainer } from '../../../../../../../common/model/flow-builder/flow-add-button';
import {
  FlowItem,
  FlowItemRenderInfo,
} from '../../../../../../../common/model/flow-builder/flow-item';
import { RightSideBarType } from '../../../../../../../common/model/enum/right-side-bar-type.enum';
import { FlowRendererService } from '../../../../../../service/flow-renderer.service';

@Component({
  selector: 'app-branch-line-connection',
  templateUrl: './branch-line-connection.component.html',
  styleUrls: ['./branch-line-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchLineConnectionComponent implements OnChanges, OnInit {
  @ViewChild('addButton') addButtonView: ElementRef;
  @ViewChild('emptyBranchAddButton') emptyBranchAddButtonView: ElementRef;
  @ViewChild('afterBranchAddButton') afterBranchAddButton: ElementRef;
  @Input() insideLoop = false;
  afterLoopArrowCommand = '';
  trueBranchLineDrawCommand = '';
  falseBranchLineDrawCommand = '';
  arrowHeadLeftFalseBranch = 0;
  arrowHeadLeftTrueBranch = 0;
  arrowHeadTop = 0;
  drawer: Drawer = new Drawer();
  addButtonAndFlowItemNameContainer: AddButtonAndFlowItemNameContainer;
  addButtonTop = '0px';
  addButtonLeft = '0px';
  emptyLoopAddButtonTopOffset = '0px';
  emptyLoopAddButtonLeftOffsetForFalseBranch = '0px';
  emptyLoopAddButtonLeftOffsetForTrueBranch = '0px';
  afterBranchAddButtonTop = '0px';
  afterBranchAddButtonLeft = '0px';
  afterLoopArrowHeadLeft = 0;
  afterBranchArrowHeadTop = 0;
  showEmptyLoopAddButtonBoxShadow = false;
  addButtonSize = {
    width: `${ADD_BUTTON_SIZE.width}px`,
    height: `${ADD_BUTTON_SIZE.height}px`,
  };
  _flowItem: BranchAction & FlowItemRenderInfo;

  showDropArea$: Observable<boolean> = new Observable<boolean>();

  @Input() viewMode: boolean;

  @Input() set flowItem(value: BranchAction & FlowItemRenderInfo) {
    this._flowItem = value;
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
    this.writeLines();
    this.calculateOffsetBeforeFirstAction();
    this.calculateOffsetAfterBranch();
    this.calculateEmptyLoopAddButton();
  }

  writeLines() {
    const trueBranchCommands: string[] = [];
    let childFlowsGraphHeight =
      EMPTY_LOOP_ADD_BUTTON_HEIGHT +
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
      VERTICAL_LINE_LENGTH;
    if (this.flowItem.onFailureAction && this.flowItem.onSuccessAction) {
      childFlowsGraphHeight = Math.max(
        (this.flowItem.onSuccessAction as FlowItem).boundingBox!.height,
        (this.flowItem.onFailureAction as FlowItem).boundingBox!.height
      );
    } else if (this.flowItem.onFailureAction) {
      childFlowsGraphHeight = Math.max(
        childFlowsGraphHeight,
        (this.flowItem.onFailureAction as FlowItem).boundingBox!.height
      );
    } else if (this.flowItem.onSuccessAction) {
      childFlowsGraphHeight = Math.max(
        childFlowsGraphHeight,
        (this.flowItem.onSuccessAction as FlowItem).boundingBox!.height
      );
    }
    trueBranchCommands.push(...this.writeBranchLine(true));
    trueBranchCommands.push(...this.writeAfterArrow(childFlowsGraphHeight));
    this.trueBranchLineDrawCommand = trueBranchCommands.join(' ');
    const falseBranchCommands: string[] = [];
    falseBranchCommands.push(...this.writeBranchLine(false));
    falseBranchCommands.push(...this.writeAfterArrow(childFlowsGraphHeight));
    this.falseBranchLineDrawCommand = falseBranchCommands.join(' ');
  }

  writeBranchLine(trueBranch: boolean) {
    const commands: string[] = [];

    commands.push(
      this.drawer.move(FLOW_ITEM_WIDTH / 2, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
    );
    commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
    commands.push(this.drawer.drawArc(trueBranch, true, !trueBranch));
    commands.push(
      this.drawer.drawHorizontalLine(
        HORZIONTAL_LINE_LENGTH * (trueBranch ? -1 : 1)
      )
    );
    commands.push(this.drawer.drawArc(trueBranch, true, trueBranch));
    commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
    return commands;
  }

  // writeLoopClosing(childFlowsGraphHeight: number) {
  //   const commands: string[] = [];
  //   commands.push(this.drawer.move(0, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
  //   if (!this.flowItem.firstLoopAction) {
  //     commands.push(this.drawer.move(0, EMPTY_LOOP_ADD_BUTTON_HEIGHT));
  //     commands.push(this.drawer.move(0, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
  //     commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
  //   } else {
  //     commands.push(this.drawer.move(0, childFlowsGraphHeight));
  //   }
  //   commands.push(this.drawer.drawArc(true, true, false));
  //   commands.push(
  //     this.drawer.drawHorizontalLine(-2.5 * HORZIONTAL_LINE_LENGTH)
  //   );
  //   commands.push(this.drawer.drawArc(true, false, false));
  //   const returningVerticalLineToBeginingLength =
  //     this.findReturningVerticalLineLength(childFlowsGraphHeight);
  //   commands.push(
  //     this.drawer.drawVerticalLine(-returningVerticalLineToBeginingLength)
  //   );
  //   commands.push(this.drawer.drawArc(false, false, false));
  //   commands.push(this.drawer.drawHorizontalLine(HORZIONTAL_LINE_LENGTH));
  //   return commands;
  // }

  writeAfterArrow(childFlowsGraphHeight: number) {
    const commands: string[] = [];
    commands.push(
      this.drawer.move(
        0.5 * HORZIONTAL_LINE_LENGTH - ARC_LENGTH,
        ARC_LENGTH +
          VERTICAL_LINE_LENGTH +
          SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
          childFlowsGraphHeight +
          ARC_LENGTH
      )
    );

    if (!this.insideLoop) {
      commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
    } else {
      commands.push(
        this.drawer.drawVerticalLine(AFTER_NESTED_LOOP_LINE_LENGTH)
      );
    }
    return commands;
  }

  calculateEmptyLoopAddButton() {
    const leftOffset = HORZIONTAL_LINE_LENGTH + 11;
    const topOffset =
      VERTICAL_LINE_LENGTH * 2 +
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
      FLOW_ITEM_WIDTH / 2 + ARC_LENGTH + HORZIONTAL_LINE_LENGTH + ARC_LENGTH;
    const rightOffset =
      FLOW_ITEM_WIDTH / 2 - ARC_LENGTH - HORZIONTAL_LINE_LENGTH - ARC_LENGTH;
    const topOffset =
      VERTICAL_LINE_LENGTH +
      ARC_LENGTH +
      ARC_LENGTH +
      VERTICAL_LINE_LENGTH -
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
    this.arrowHeadLeftFalseBranch =
      rightOffset - (ARROW_HEAD_SIZE.width / 2.0 + lineStrokeOffset);
    this.arrowHeadLeftTrueBranch =
      leftOffset - (ARROW_HEAD_SIZE.width / 2.0 + lineStrokeOffset);
    this.arrowHeadTop = topOffset + ARROW_HEAD_SIZE.height;

    this.addButtonLeft = leftOffset - ADD_BUTTON_SIZE.width / 2.0 + 'px';
    this.addButtonTop = topOffset - VERTICAL_LINE_LENGTH / 2.0 + 'px';
  }

  calculateOffsetAfterBranch() {
    const topOffset =
      this.flowItem.connectionsBox!.height -
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE -
      (this.flowItem.nextAction ? ARROW_HEAD_SIZE.height : 0);

    this.afterBranchAddButtonTop = `${
      topOffset -
      VERTICAL_LINE_LENGTH / 2.0 -
      (this.insideLoop ? ARROW_HEAD_SIZE.height : 1)
    }px`;
    this.afterBranchAddButtonLeft = `calc(50% - ${ADD_BUTTON_SIZE.width / 2}px`;
    const lineStrokeOffset = 1.5;
    this.afterBranchArrowHeadTop =
      topOffset - ARROW_HEAD_SIZE.height - lineStrokeOffset + 5;
    this.afterLoopArrowHeadLeft =
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

  loopItemStyle() {
    return {
      width: FLOW_ITEM_WIDTH + 'px',
      height: FLOW_ITEM_HEIGHT + 'px',
      top:
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        VERTICAL_LINE_LENGTH +
        ARC_LENGTH +
        ARC_LENGTH +
        VERTICAL_LINE_LENGTH +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        'px',
      left:
        FLOW_ITEM_WIDTH / 2 +
        ARC_LENGTH * 2 +
        HORZIONTAL_LINE_LENGTH -
        FLOW_ITEM_WIDTH / 2 +
        'px',
      position: 'relative',
    };
  }
}
