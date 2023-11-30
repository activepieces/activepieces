import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  BuilderSelectors,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';
import { Component, Input } from '@angular/core';
import { StepLocationRelativeToParent } from '@activepieces/shared';
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
  constructor(protected store: Store) {
    this.selectedAddBtnId$ = this.store.select(
      BuilderSelectors.selectLastClickedAddBtnId
    );
  }
  setSelectedAddBtnId() {
    this.store.dispatch(canvasActions.setAddButtonId({ id: this.addButtonId }));
  }
}
