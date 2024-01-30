import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  BuilderSelectors,
  StepRunResult,
} from '@activepieces/ui/feature-builder-store';
import { Store } from '@ngrx/store';
import { Observable, take } from 'rxjs';

@Component({
  selector: 'app-iteration-accordion',
  templateUrl: './iteration-accordion.component.html',
  styleUrls: ['./iteration-accordion.component.css'],
})
export class IterationAccordionComponent {
  @Input() iterationIndex: number;
  @Input() set IterationResults(
    iteration: Pick<StepRunResult, 'stepName' | 'output'>[]
  ) {
    this.iterationResult$ = this.store
      .select(
        BuilderSelectors.selectStepDisplayNameAndDfsIndexForIterationOutput(
          iteration
        )
      )
      .pipe(take(1));
  }
  @Input() selectedStepName: string | null;
  @Input() nestingLevel = 0;
  iterationResult$: Observable<StepRunResult[]>;
  constructor(private store: Store) {}
  @Output() childStepSelected = new EventEmitter();

  stopPropagation(event: MouseEvent) {
    event.stopPropagation();
  }
  childStepSelectedHandler() {
    this.childStepSelected.emit();
  }
}
