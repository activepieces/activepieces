import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import { map, Observable, take, tap } from 'rxjs';
import {
  UpdateActionRequest,
  UpdateTriggerRequest,
} from '@activepieces/shared';
import {
  BuilderSelectors,
  FlowsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-step-name-editor',
  templateUrl: './step-name-editor.component.html',
  styleUrls: ['./step-name-editor.component.scss'],
})
export class StepNameEditorComponent {
  isEditingStepName = false;
  isInDebugMode$: Observable<boolean>;
  currentStepName$: Observable<string>;
  updateStepName$: Observable<void>;
  constructor(private store: Store) {
    this.isInDebugMode$ = this.store.select(BuilderSelectors.selectReadOnly);
    this.currentStepName$ = this.store.select(
      BuilderSelectors.selectCurrentStepDisplayName
    );
  }
  editingStepNameToggle(isEditingStepName: boolean) {
    this.isEditingStepName = isEditingStepName;
  }
  saveStepName(stepName: string) {
    this.updateStepName$ = this.store
      .select(BuilderSelectors.selectCurrentStep)
      .pipe(
        take(1),
        tap((step) => {
          if (step?.name === 'trigger') {
            const clone = {
              ...step,
              displayName: stepName,
            } as UpdateTriggerRequest;
            this.store.dispatch(
              FlowsActions.updateTrigger({ operation: clone })
            );
          } else if (step?.name) {
            const clone = {
              ...step,
              displayName: stepName,
            } as UpdateActionRequest;
            this.store.dispatch(
              FlowsActions.updateAction({ operation: clone })
            );
          }
        }),
        map(() => void 0)
      );
  }
}
