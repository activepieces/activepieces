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

  constructor(
    protected testStepService: TestStepService,
    protected store: Store
  ) {
    this.isSaving$ = this.store.select(BuilderSelectors.selectIsSaving);
  }
  readonly POLLING_TEST_INTERVAL_MS = 500;
  ngOnInit(): void {
    this.testStepService.testingStepSectionIsRendered$.next(true);
  }

  ngOnDestroy(): void {
    this.testStepService.testingStepSectionIsRendered$.next(false);
  }
}
