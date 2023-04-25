import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { FlowInstance, FlowInstanceStatus } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { FlowInstanceActions } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-toggle-instance-state',
  templateUrl: './toggle-instance-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleInstanceStateComponent implements OnInit {
  toggleFormControl: FormControl<boolean> = new FormControl();
  instanceStateChanged$: Observable<boolean>;
  @Input() set instance(val: FlowInstance) {
    this.toggleFormControl.setValue(val.status === FlowInstanceStatus.ENABLED, {
      emitEvent: false,
    });
  }
  constructor(private store: Store) {}

  ngOnInit(): void {
    this.instanceStateChanged$ = this.toggleFormControl.valueChanges.pipe(
      tap((toggleValue) => {
        if (toggleValue) {
          this.store.dispatch(FlowInstanceActions.enableInstance());
        } else {
          this.store.dispatch(FlowInstanceActions.disableInstance());
        }
      })
    );
  }
}
