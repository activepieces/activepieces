import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import {
  BuilderSelectors,
  FlowsActions,
  RightSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Component, Input } from '@angular/core';
import {
  Action,
  ActionType,
  StepLocationRelativeToParent,
  flowHelper,
} from '@activepieces/shared';
import { DropEvent } from 'angular-draggable-droppable';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FlowRendererService } from '@activepieces/ui/common';
@Component({ template: '' })
export class AddButtonCoreComponent {
  readonly INVALID_DROP_MESSAGE = $localize`Can't move here`;
  readonly STEPS_WITH_CHILDREN = [ActionType.BRANCH, ActionType.LOOP_ON_ITEMS];
  static id = 0;
  addButtonId = AddButtonCoreComponent.id++;
  selectedAddBtnId$: Observable<number | undefined>;
  @Input({ required: true })
  stepName = '';
  @Input({ required: true }) left = 0;
  @Input({ required: true }) top = 0;
  @Input({ required: true }) stepLocationRelativeToParent =
    StepLocationRelativeToParent.AFTER;
  showCursorOnHover$: Observable<boolean>;
  isInDragginStepMode$: Observable<boolean>;
  showButtonShadow = false;
  constructor(
    protected store: Store,
    private flowRendererService: FlowRendererService,
    private snackbar: MatSnackBar
  ) {
    this.selectedAddBtnId$ = this.store.select(
      BuilderSelectors.selectLastClickedAddBtnId
    );
    this.isInDragginStepMode$ = this.flowRendererService.isDragginStep$;
    this.showCursorOnHover$ = this.isInDragginStepMode$.pipe(
      map((res) => !res)
    );
  }
  setSelectedAddBtnId() {
    this.store.dispatch(canvasActions.setAddButtonId({ id: this.addButtonId }));
  }
  add() {
    this.store.dispatch(
      canvasActions.setRightSidebar({
        sidebarType: RightSideBarType.STEP_TYPE,
        props: {
          stepLocationRelativeToParent: this.stepLocationRelativeToParent,
          stepName: this.stepName,
        },
        deselectCurrentStep: true,
      })
    );
  }
  drop($event: DropEvent<{ content: Action }>) {
    if (this.validateDrop($event)) {
      this.store.dispatch(
        FlowsActions.moveAction({
          operation: {
            name: $event.dropData.content.name,
            newParentStep: this.stepName,
            stepLocationRelativeToNewParent: this.stepLocationRelativeToParent,
          },
        })
      );
    } else if (flowHelper.doesActionHaveChildren($event.dropData.content)) {
      this.snackbar.open(this.INVALID_DROP_MESSAGE);
    }
  }

  private validateDrop($event: DropEvent<{ content: Action }>): boolean {
    return !(
      (flowHelper.doesActionHaveChildren($event.dropData.content) &&
        flowHelper.isChildOf($event.dropData.content, this.stepName)) ||
      $event.dropData.content.name === this.stepName
    );
  }
  toggleButtonShadow(val: boolean) {
    this.showButtonShadow = val;
  }
}
