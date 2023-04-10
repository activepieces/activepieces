import { Component, OnDestroy, OnInit } from '@angular/core';
import { TestStepService } from '@activepieces/ui/common';

@Component({
  template: ``,
})
export class TestStepCoreComponent implements OnDestroy, OnInit {
  constructor(protected testStepService: TestStepService) {}
  readonly POLLING_TEST_INTERVAL_MS = 3000;
  ngOnInit(): void {
    this.testStepService.testingStepSectionIsRendered$.next(true);
  }

  ngOnDestroy(): void {
    this.testStepService.testingStepSectionIsRendered$.next(false);
  }
}
