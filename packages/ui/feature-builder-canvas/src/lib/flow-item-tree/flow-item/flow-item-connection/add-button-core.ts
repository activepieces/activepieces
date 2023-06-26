import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  BuilderSelectors,
  canvasActions,
} from '@activepieces/ui/feature-builder-store';

export class AddButtonCore {
  static id = 0;
  addButtonId = AddButtonCore.id++;
  selectedAddBtnId$: Observable<number | undefined>;
  constructor(protected store: Store) {
    this.selectedAddBtnId$ = this.store.select(
      BuilderSelectors.selectLastClickedAddBtnId
    );
  }
  setSelectedAddBtnId() {
    this.store.dispatch(canvasActions.setAddButtonId({ id: this.addButtonId }));
  }
}
