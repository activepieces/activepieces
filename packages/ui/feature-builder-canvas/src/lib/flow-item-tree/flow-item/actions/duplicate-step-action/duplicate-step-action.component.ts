import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BuilderSelectors, FlowItem } from '../../../../../../../feature-builder-store/src';
import { forkJoin, take,tap } from 'rxjs';
import { Store } from '@ngrx/store';
@Component({
  selector: 'app-duplicate-step-action',
  templateUrl: './duplicate-step-action.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuplicateStepActionComponent {
  @Input({required:true})
  flowItem: FlowItem;
  constructor(private store:Store){}
  duplicateStep()
  {
  const x =  forkJoin({
      currentFlow: this.store
        .select(BuilderSelectors.selectCurrentFlow)
        .pipe(take(1)),
      rightSideBar: this.store
        .select(BuilderSelectors.selectCurrentRightSideBar)
        .pipe(take(1)),
      currentStep: this.store
        .select(BuilderSelectors.selectCurrentStep)
        .pipe(take(1)),
    }).pipe(tap(res=>{

    }))
  }
}
