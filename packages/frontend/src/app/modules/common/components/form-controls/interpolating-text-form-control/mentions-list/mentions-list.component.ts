import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';

@Component({
	selector: 'app-mentions-list',
	templateUrl: './mentions-list.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionsListComponent {
	searchFormControl: FormControl<string> = new FormControl('', { nonNullable: true });
	dropDownItems$: Observable<{ label: string; value: string }[]>;
	constructor(private store: Store) {
		const allConfigs$ = this.store.select(BuilderSelectors.selectAllConfigsForMentionsDropdown);
		const allSteps$ = this.store.select(BuilderSelectors.selectAllStepsForMentionsDropdown);
		this.dropDownItems$ = combineLatest({
			configs: allConfigs$,
			steps: allSteps$,
			search: this.searchFormControl.valueChanges.pipe(startWith('')),
		}).pipe(
			map(res => {
				const items = [...res.configs, ...res.steps];
				console.log(items);
				return items.filter(item => item.label.toLowerCase().includes(res.search.toLowerCase()));
			})
		);
	}
}
