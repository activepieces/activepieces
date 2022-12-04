import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, Observable, take } from 'rxjs';
import { BuilderSelectors } from '../layout/flow-builder/store/selector/flow-builder.selector';

@Injectable({
	providedIn: 'root',
})
export class BuilderSavingGuard implements CanDeactivate<any> {
	constructor(private store: Store) {}
	canDeactivate(): Observable<boolean> {
		return this.store.select(BuilderSelectors.selectSavingChangeState).pipe(
			map((saving: boolean) => {
				if (!saving) return true;
				else return confirm('You have unsaved changes on this page, are you sure you want to leave?');
			}),
			take(1)
		);
	}
}
