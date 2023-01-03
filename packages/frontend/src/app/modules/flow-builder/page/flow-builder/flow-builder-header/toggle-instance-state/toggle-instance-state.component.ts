import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';
import { Instance, InstanceStatus } from 'shared';
import { disableInstance, enableInstance } from 'src/app/modules/flow-builder/store/action/collection.action';

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
			this.toggleFormControl.setValue(instance.status === InstanceStatus.ENABLED, { emitEvent: false });
		}
		this._collectionInstance = instance;
	}
	constructor(private store: Store) {}
	ngOnInit(): void {
		this.toggleFormControl.setValue(this._collectionInstance?.status === InstanceStatus.ENABLED);
		this.instanceStateChanged$ = this.toggleFormControl.valueChanges.pipe(
			tap(res => {
				if (res) {
					this.store.dispatch(enableInstance());
				} else {
					this.store.dispatch(disableInstance());
				}
			})
		);
	}
}
