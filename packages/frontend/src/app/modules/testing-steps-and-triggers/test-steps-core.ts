import { Component, OnDestroy, OnInit } from '@angular/core';
import { TestStepService } from '../flow-builder/service/test-step.service';
@Component({
  template: ``,
})
export class TestStepCoreComponent implements OnDestroy, OnInit {
  constructor(protected testStepService: TestStepService) {}
  ngOnInit(): void {
    this.testStepService.testingStepSectionIsRendered$.next(true);
  }

  ngOnDestroy(): void {
    this.testStepService.testingStepSectionIsRendered$.next(false);
  }
}
