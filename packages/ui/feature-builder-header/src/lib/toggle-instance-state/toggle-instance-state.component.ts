import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { Instance, InstanceStatus } from '@activepieces/shared';

@Component({
  selector: 'app-toggle-instance-state',
  templateUrl: './toggle-instance-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleInstanceStateComponent implements OnInit {
  toggleFormControl: FormControl<boolean> = new FormControl();
  instanceStateChanged$: Observable<boolean>;
  _collectionInstance: Instance | undefined;
  @Input() collectionId: string;
  @Input() set collectionInstance(instance: Instance | undefined) {
    if (instance && this.toggleFormControl) {
      this.toggleFormControl.setValue(
        instance.status === InstanceStatus.ENABLED,
        { emitEvent: false }
      );
    }
    this._collectionInstance = instance;
  }
  ngOnInit(): void {
    this.toggleFormControl.setValue(
      this._collectionInstance?.status === InstanceStatus.ENABLED
    );
    this.instanceStateChanged$ = this.toggleFormControl.valueChanges.pipe(
      tap((res) => {
        // TODO FIX THIS
      })
    );
  }
}
