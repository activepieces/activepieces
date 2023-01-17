import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import { ActionType } from 'shared';
import { FlowItem } from 'src/app/modules/common/model/flow-builder/flow-item';
import { BuilderSelectors } from 'src/app/modules/flow-builder/store/selector/flow-builder.selector';
import { InsertMentionOperation, MentionListItem } from '../utils';

@Component({
	selector: 'app-mentions-list',
	templateUrl: './mentions-list.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionsListComponent {
	searchFormControl: FormControl<string> = new FormControl('', { nonNullable: true });
	stepsMentions$: Observable<(MentionListItem & { step: FlowItem })[]>;
	configsMentions$: Observable<MentionListItem[]>;
	ActionType = ActionType;
	@Output()
	addMention: EventEmitter<InsertMentionOperation> = new EventEmitter();
	@Output()
	closeMenu: EventEmitter<void> = new EventEmitter();
	constructor(private store: Store) {
		this.stepsMentions$ = combineLatest({
			steps: this.store.select(BuilderSelectors.selectAllStepsForMentionsDropdown),
			search: this.searchFormControl.valueChanges.pipe(startWith('')),
		}).pipe(
			map(res => {
				return res.steps.filter(item => item.label.toLowerCase().includes(res.search.toLowerCase()));
			})
		);
		this.configsMentions$ = combineLatest({
			configs: this.store.select(BuilderSelectors.selectAllConfigsForMentionsDropdown),
			search: this.searchFormControl.valueChanges.pipe(startWith('')),
		}).pipe(
			map(res => {
				return res.configs.filter(item => item.label.toLowerCase().includes(res.search.toLowerCase()));
			})
		);
	}
	mentionClicked(mention: MentionListItem) {
		this.addMention.emit({
			insert: { mention: { serverValue: mention.value, value: mention.label, denotationChar: '' } },
		});
	}
}
