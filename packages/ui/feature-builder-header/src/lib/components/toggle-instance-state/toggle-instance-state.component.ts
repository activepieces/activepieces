import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, tap } from 'rxjs';
import { FlowStatus } from '@activepieces/shared';
import { Store } from '@ngrx/store';
import { FlowsActions } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-toggle-instance-state',
  templateUrl: './toggle-instance-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleInstanceStateComponent implements OnInit {
  toggleFormControl: FormControl<boolean> = new FormControl();
  instanceStateChanged$: Observable<boolean>;
  @Input({ required: true }) set flowStatus(val: FlowStatus) {
    this.toggleFormControl.setValue(val === FlowStatus.ENABLED, {
      emitEvent: false,
    });
  }
  constructor(private store: Store) {}

  ngOnInit(): void {
    this.instanceStateChanged$ = this.toggleFormControl.valueChanges.pipe(
      tap((toggleValue) => {
        if (toggleValue) {
          this.store.dispatch(FlowsActions.enableFlow());
        } else {
          this.store.dispatch(FlowsActions.disableFlow());
        }
      })
    );
  }
}
