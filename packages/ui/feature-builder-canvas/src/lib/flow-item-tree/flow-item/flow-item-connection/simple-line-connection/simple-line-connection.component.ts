import {
  AfterViewInit,
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
  AddButtonAndFlowItemNameContainer,
  FlowItem,
  FlowRendererService,
  FlowsActions,
  RightSideBarType,
  canvasActions,
  ADD_BUTTON_SIZE,
  ARROW_HEAD_SIZE,
  Drawer,
  FLOW_ITEM_WIDTH,
  SPACE_BETWEEN_ITEM_CONTENT_AND_LINE,
  VERTICAL_LINE_LENGTH,
} from '@activepieces/ui/feature-builder-store';
import {
  ActionType,
  StepLocationRelativeToParent,
  TriggerType,
  flowHelper,
} from '@activepieces/shared';
import { DropEvent } from 'angular-draggable-droppable';
import { fadeIn400ms } from '@activepieces/ui/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-simple-line-connection',
  templateUrl: './simple-line-connection.component.html',
  styleUrls: ['./simple-line-connection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class SimpleLineConnectionComponent
  implements OnInit, AfterViewInit, OnChanges
{
  @ViewChild('addButton') addButtonView: ElementRef;
  addButtonAndFlowItemNameContainer: AddButtonAndFlowItemNameContainer;
  @Input() flowItem: FlowItem;
  @Input() readOnly: boolean;
  insideDropArea = false;
  inDraggingMode$: Observable<boolean>;
  showDropArea$: Observable<boolean> = new Observable<boolean>();
  drawer: Drawer = new Drawer();
  SVG_HEIGHT: number =
    SPACE_BETWEEN_ITEM_CONTENT_AND_LINE +
    VERTICAL_LINE_LENGTH +
    SPACE_BETWEEN_ITEM_CONTENT_AND_LINE;
  arrowHeadLeft = '0px';
  arrowHeadTop = '0px';
  addButtonLeft = '0px';
  addButtonTop = '0px';
  addButtonSize = {
    width: `${ADD_BUTTON_SIZE.width}px`,
    height: `${ADD_BUTTON_SIZE.height}px`,
  };
  drawCommand: string;
  constructor(
    private store: Store,
    private flowRendererService: FlowRendererService,
    private snackbar: MatSnackBar
  ) {
    this.inDraggingMode$ =
      this.flowRendererService.draggingSubject.asObservable();
  }

  ngOnInit(): void {
    this.drawCommand = [
      this.drawer.move(
        FLOW_ITEM_WIDTH / 2,
        SPACE_BETWEEN_ITEM_CONTENT_AND_LINE
      ),
      this.drawer.drawVerticalLine(VERTICAL_LINE_LENGTH),
    ].join(' ');
    this.calculateOffsetsForAddButtonAndArrowHead();
    this.showDropArea$ = this.flowRendererService.draggingSubject;
  }

  ngAfterViewInit(): void {
    this.insertAddButtonToRendererServiceListOfContainers();
    this.calculateOffsetsForAddButtonAndArrowHead();
  }

  insertAddButtonToRendererServiceListOfContainers() {
    if (this.addButtonView !== null && this.addButtonView !== undefined) {
      this.addButtonAndFlowItemNameContainer =
        new AddButtonAndFlowItemNameContainer(
          this.addButtonView.nativeElement,
          this.flowItem.name
        );
      this.flowRendererService.addButtonsWithStepNamesContainers.push(
        this.addButtonAndFlowItemNameContainer
      );
    }
  }

  calculateOffsetsForAddButtonAndArrowHead() {
    const strokeWidth = 2;
    this.addButtonTop = `${VERTICAL_LINE_LENGTH / 2}px`;
    this.addButtonLeft = `calc(50% - ${ADD_BUTTON_SIZE.width / 2}px)`;
    this.arrowHeadLeft =
      this.flowItem.boundingBox!.width / 2.0 -
      ARROW_HEAD_SIZE.width / 2.0 -
      strokeWidth / 2.0 -
      0.5 +
      'px';
    this.arrowHeadTop = `${VERTICAL_LINE_LENGTH - 1}px`;
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

  hasNextAction() {
    return (
      this.flowItem.nextAction !== undefined &&
      this.flowItem.nextAction !== null
    );
  }
  drop($event: DropEvent<FlowItem>) {
    if (
      ($event.dropData.type === ActionType.LOOP_ON_ITEMS ||
        $event.dropData.type === ActionType.BRANCH) &&
      this.flowItem.type !== TriggerType.EMPTY &&
      this.flowItem.type !== TriggerType.PIECE &&
      this.flowItem.type !== TriggerType.WEBHOOK
    ) {
      if (flowHelper.isChildOf($event.dropData, this.flowItem)) {
        this.snackbar.open(this.flowRendererService.INVALID_DROP_MESSAGE);
        return;
      }
    }
    if ($event.dropData.name !== this.flowItem.name)
      this.store.dispatch(
        FlowsActions.moveAction({
          operation: {
            name: $event.dropData.name,
            newParentStep: this.flowItem.name,
          },
        })
      );
  }
}
