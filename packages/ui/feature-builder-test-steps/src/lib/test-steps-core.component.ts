import { Component, OnDestroy, OnInit } from '@angular/core';
import { TestStepService } from '@activepieces/ui/common';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '@activepieces/ui/feature-builder-store';

@Component({
  template: ``,
})
export class TestStepCoreComponent implements OnDestroy, OnInit {
  isSaving$: Observable<boolean>;
  readonly savingMessage = 'Saving...';
  currentStepDisplayName$: Observable<string>;
  constructor(
    protected testStepService: TestStepService,
    protected store: Store
  ) {
    this.isSaving$ = this.store.select(BuilderSelectors.selectIsSaving);
    this.currentStepDisplayName$ = this.store.select(
      BuilderSelectors.selectCurrentStepDisplayName
    );
  }
  readonly POLLING_TEST_INTERVAL_MS = 1100;
  ngOnInit(): void {
    this.testStepService.testingStepSectionIsRendered$.next(true);
  }

  ngOnDestroy(): void {
    this.testStepService.testingStepSectionIsRendered$.next(false);
  }
}
