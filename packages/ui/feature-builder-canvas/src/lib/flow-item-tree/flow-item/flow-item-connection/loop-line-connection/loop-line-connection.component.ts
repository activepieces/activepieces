import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  ActionType,
  LoopOnItemsAction,
  StepLocationRelativeToParent,
  flowHelper,
} from '@activepieces/shared';
import {
  AddButtonAndFlowItemNameContainer,
  FlowItem,
  FlowItemRenderInfo,
  FlowRenderUtil,
  FlowRendererService,
  FlowsActions,
  RightSideBarType,
  canvasActions,
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
} from '@activepieces/ui/feature-builder-store';
import { DropEvent } from 'angular-draggable-droppable';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-loop-line-connection',
  templateUrl: './loop-line-connection.component.html',
  styleUrls: ['./loop-line-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoopLineConnectionComponent implements OnChanges, OnInit {
  @ViewChild('addButton') addButtonView: ElementRef;
  @ViewChild('emptyLoopAddButton') emptyLoopAddButtonView: ElementRef;
  @ViewChild('afterLoopAddButton') afterLoopAddButton: ElementRef;
  @Input() insideLoopOrBranch = false;
  isDraggingOverFirstLoopAction = false;
  isDraggingOverAfterLoopAction = false;
  afterLoopArrowCommand = '';
  startingLoopLineDrawCommand = '';
  loopingArrowHeadLeft = 0;
  loopingArrowHeadTop = 0;
  drawer: Drawer = new Drawer();
  addButtonAndFlowItemNameContainer: AddButtonAndFlowItemNameContainer;
  addButtonTop = '0px';
  addButtonLeft = '0px';
  emptyLoopAddButtonTopOffset = '0px';
  emptyLoopAddButtonLeftOffset = '0px';
  afterLoopAddButtonTop = '0px';
  afterLoopAddButtonLeft = '0px';
  afterLoopArrowHeadLeft = 0;
  afterLoopArrowHeadTop = 0;
  showEmptyLoopAddButtonBoxShadow = false;
  svgHeight = 0;
  addButtonSize = {
    width: `${ADD_BUTTON_SIZE.width}px`,
    height: `${ADD_BUTTON_SIZE.height}px`,
  };
  _flowItem: LoopOnItemsAction & FlowItemRenderInfo;
  numberOfNestedBranches = 0;
  showDropArea$: Observable<boolean> = new Observable<boolean>();

  @Input() readOnly: boolean;

  @Input() set flowItem(value: LoopOnItemsAction & FlowItemRenderInfo) {
    this._flowItem = value;
    this.svgHeight = this.flowItem.connectionsBox!.height;
    this.numberOfNestedBranches = FlowRenderUtil.findNumberOfNestedBranches(
      this._flowItem.firstLoopAction
    );
    this.writeLines();
    this.calculateOffsetBeforeFirstAction();
    this.calculateOffsetAfterLoop();
    this.calculateEmptyLoopAddButton();
  }

  get flowItem() {
    return this._flowItem;
  }

  constructor(
    private store: Store,
    private flowRendererService: FlowRendererService,
    private snackbar: MatSnackBar
  ) {
    this.showDropArea$ = this.flowRendererService.draggingSubject;
  }
  ngOnInit(): void {
    this.numberOfNestedBranches = FlowRenderUtil.findNumberOfNestedBranches(
      this._flowItem.firstLoopAction
    );
    this.writeLines();
    this.calculateOffsetBeforeFirstAction();
    this.calculateOffsetAfterLoop();
    this.calculateEmptyLoopAddButton();
  }

  writeLines() {
    const commands: string[] = [];
    let childFlowsGraphHeight = 0;
    if (
      this.flowItem.firstLoopAction === undefined ||
      this.flowItem.firstLoopAction === null
    ) {
      childFlowsGraphHeight =
        EMPTY_LOOP_ADD_BUTTON_HEIGHT +
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
        VERTICAL_LINE_LENGTH;
    } else {
      childFlowsGraphHeight = (this.flowItem.firstLoopAction as FlowItem)
        .boundingBox!.height;
    }
    commands.push(...this.writeStartingLine());
    commands.push(...this.writeLoopClosing(childFlowsGraphHeight));
    commands.push(...this.writeAfterArrow(childFlowsGraphHeight));
    this.startingLoopLineDrawCommand = commands.join(' ');
  }

  writeStartingLine() {
    const commands: string[] = [];
    commands.push(
      this.drawer.move(FLOW_ITEM_WIDTH / 2, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
    );
    commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
    commands.push(this.drawer.drawArc(false, true, true));
    commands.push(this.drawer.drawHorizontalLine(HORZIONTAL_LINE_LENGTH));
    commands.push(this.drawer.drawArc(false, true, false));
    commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
    return commands;
  }

  writeLoopClosing(childFlowsGraphHeight: number) {
    const commands: string[] = [];
    commands.push(this.drawer.move(0, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
    if (!this.flowItem.firstLoopAction) {
      if (!this.readOnly) {
        commands.push(this.drawer.move(0, EMPTY_LOOP_ADD_BUTTON_HEIGHT));
        commands.push(this.drawer.move(0, SPACE_BETWEEN_ITEM_CONTENT_AND_LINE));
        commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
      } else {
        commands.push(
          this.drawer.move(0, -SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
        );
        commands.push(
          this.drawer.drawVerticalLine(EMPTY_LOOP_ADD_BUTTON_HEIGHT)
        );
        commands.push(
          this.drawer.drawVerticalLine(2 * SPACE_BETWEEN_ITEM_CONTENT_AND_LINE)
        );
        commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
      }
    } else {
      commands.push(this.drawer.move(0, childFlowsGraphHeight));
    }
    const childGraphWIdth =
      this.numberOfNestedBranches * (HORZIONTAL_LINE_LENGTH * 2);
    commands.push(this.drawer.drawArc(true, true, false));
    commands.push(
      this.drawer.drawHorizontalLine(
        -2 * HORZIONTAL_LINE_LENGTH - childGraphWIdth
      )
    );
    commands.push(this.drawer.drawArc(true, false, false));
    const returningVerticalLineToBeginingLength =
      this.findReturningVerticalLineLength(childFlowsGraphHeight);
    commands.push(
      this.drawer.drawVerticalLine(-returningVerticalLineToBeginingLength)
    );
    commands.push(this.drawer.drawArc(false, false, false));
    commands.push(
      this.drawer.drawHorizontalLine(
        HORZIONTAL_LINE_LENGTH * 0.75 + childGraphWIdth
      )
    );
    return commands;
  }

  writeAfterArrow(childFlowsGraphHeight: number) {
    const commands: string[] = [];
    commands.push(
      this.drawer.move(
        HORZIONTAL_LINE_LENGTH * 0.165,
        ARC_LENGTH +
          VERTICAL_LINE_LENGTH +
          SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
          childFlowsGraphHeight +
          ARC_LENGTH +
          SPACE_BETWEEN_ITEM_CONTENT_AND_LINE / 2
      )
    );

    if (!this.insideLoopOrBranch) {
      commands.push(this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH));
    } else {
      commands.push(
        this.drawer.drawVerticalLine(AFTER_NESTED_LOOP_LINE_LENGTH)
      );
    }
    return commands;
  }

  insertAddButtonToRendererServiceListOfContainers() {
    if (this.flowItem.firstLoopAction) {
      this.addButtonAndFlowItemNameContainer =
        new AddButtonAndFlowItemNameContainer(
          this.addButtonView.nativeElement,
          this.flowItem.name
        );
      this.flowRendererService.addButtonsWithStepNamesContainers.push(
        this.addButtonAndFlowItemNameContainer
      );
    } else {
      this.addButtonAndFlowItemNameContainer =
        new AddButtonAndFlowItemNameContainer(
          this.emptyLoopAddButtonView.nativeElement,
          this.flowItem.name
        );
      this.flowRendererService.addButtonsWithStepNamesContainers.push(
        this.addButtonAndFlowItemNameContainer
      );
    }
  }

  calculateEmptyLoopAddButton() {
    const leftOffset = HORZIONTAL_LINE_LENGTH + 11;
    const topOffset =
      VERTICAL_LINE_LENGTH * 2 +
      ARC_LENGTH * 2 +
      2 * SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
    this.emptyLoopAddButtonTopOffset = `${topOffset}px`;
    this.emptyLoopAddButtonLeftOffset = `calc(50% + ${leftOffset}px`;
  }

  calculateOffsetBeforeFirstAction() {
    const leftOffset =
      FLOW_ITEM_WIDTH / 2 + ARC_LENGTH + HORZIONTAL_LINE_LENGTH + ARC_LENGTH;
    const topOffset =
      VERTICAL_LINE_LENGTH +
      ARC_LENGTH +
      ARC_LENGTH +
      VERTICAL_LINE_LENGTH -
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
    this.loopingArrowHeadLeft = 111.5;
    this.loopingArrowHeadTop = 90.5;

    this.addButtonLeft = leftOffset - ADD_BUTTON_SIZE.width / 2.0 + 'px';
    this.addButtonTop = topOffset - VERTICAL_LINE_LENGTH / 2.0 + 'px';
  }

  calculateOffsetAfterLoop() {
    const topOffset =
      this.flowItem.connectionsBox!.height -
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE -
      (this.flowItem.nextAction ? ARROW_HEAD_SIZE.height : 0);

    this.afterLoopAddButtonTop = `${
      topOffset -
      VERTICAL_LINE_LENGTH / 2.0 -
      (this.insideLoopOrBranch ? ARROW_HEAD_SIZE.height : 1)
    }px`;
    this.afterLoopAddButtonLeft = `calc(50% - ${ADD_BUTTON_SIZE.width / 2}px`;
    const lineStrokeOffset = 1.5;
    this.afterLoopArrowHeadTop =
      topOffset -
      ARROW_HEAD_SIZE.height -
      lineStrokeOffset +
      SPACE_BETWEEN_ITEM_CONTENT_AND_LINE / 2;
    this.afterLoopArrowHeadLeft =
      this.flowItem.connectionsBox!.width / 2.0 -
      ARROW_HEAD_SIZE.width / 2 -
      lineStrokeOffset;
  }

  addLoopItem() {
    this.store.dispatch(
      canvasActions.setRightSidebar({
        sidebarType: RightSideBarType.STEP_TYPE,
        props: {
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_LOOP,
          stepName: this.flowItem.name,
        },
        deselectCurrentStep: true,
      })
    );
  }

  add() {
    this.store.dispatch(
      canvasActions.setRightSidebar({
        sidebarType: RightSideBarType.STEP_TYPE,
        props: {
          stepLocationRelativeToParent: StepLocationRelativeToParent.AFTER,
          stepName: this.flowItem.name,
        },
        deselectCurrentStep: true,
      })
    );
  }

  findReturningVerticalLineLength(subGraph: number) {
    return (
      subGraph + VERTICAL_LINE_LENGTH + SPACE_BETWEEN_ITEM_CONTENT_AND_LINE
    );
  }

  ngOnChanges(): void {
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
  dropAtTheStartOfLoop(event$: DropEvent<FlowItem>) {
    if (event$.dropData.name === this._flowItem.name) {
      this.snackbar.open(this.flowRendererService.INVALID_DROP_MESSAGE);
      return;
    }
    if (
      event$.dropData.type === ActionType.LOOP_ON_ITEMS ||
      event$.dropData.type === ActionType.BRANCH
    ) {
      if (flowHelper.isChildOf(event$.dropData, this._flowItem)) {
        this.snackbar.open(this.flowRendererService.INVALID_DROP_MESSAGE);
        return;
      }
    }
    this.store.dispatch(
      FlowsActions.moveAction({
        operation: {
          name: event$.dropData.name,
          newParentStep: this._flowItem.name,
          stepLocationRelativeToNewParent:
            StepLocationRelativeToParent.INSIDE_LOOP,
        },
      })
    );
  }
  dropAfterLoop(event$: DropEvent<FlowItem>) {
    if (event$.dropData.name === this.flowItem.name) {
      return;
    }
    this.store.dispatch(
      FlowsActions.moveAction({
        operation: {
          name: event$.dropData.name,
          newParentStep: this._flowItem.name,
        },
      })
    );
  }
}
