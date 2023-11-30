import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';
import {
  BuilderSelectors,
  FlowItem,
  FlowRendererService,
  FlowsActions,
  RightSideBarType,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Component, Input } from '@angular/core';
import { StepLocationRelativeToParent } from '@activepieces/shared';
import { DropEvent } from 'angular-draggable-droppable';
@Component({ template: '' })
export class AddButtonCoreComponent {
  static id = 0;
  addButtonId = AddButtonCoreComponent.id++;
  selectedAddBtnId$: Observable<number | undefined>;
  @Input({ required: true })
  stepName = '';
  @Input({ required: true }) left = '';
  @Input({ required: true }) top = '';
  @Input({ required: true }) stepLocationRelativeToParent =
    StepLocationRelativeToParent.AFTER;
  showCursorOnHover$: Observable<boolean>;
  isInDragginStepMode$: Observable<boolean>;
  constructor(
    protected store: Store,
    private flowRendererService: FlowRendererService
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
  drop(event$: DropEvent<{ content: FlowItem }>) {
    console.log(event$);
    this.store.dispatch(
      FlowsActions.moveAction({
        operation: {
          name: event$.dropData.content.name,
          newParentStep: this.stepName,
          stepLocationRelativeToNewParent: this.stepLocationRelativeToParent,
        },
      })
    );
  }
}
