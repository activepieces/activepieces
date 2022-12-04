import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { BuilderSelectors } from '../../../../../store/selector/flow-builder.selector';
import { PieceAction } from '../../../../../store/action/piece.action';
import { FlowsActions } from '../../../../../store/action/flows.action';
import { Config } from '../../../../../../common-layout/model/fields/variable/config';
import { ConfigScope } from '../../../../../../common-layout/model/enum/config-scope-type.enum';

@Component({
	selector: 'app-configs-list',
	templateUrl: './configs-list.component.html',
	styleUrls: ['./configs-list.component.css'],
})
export class VariableListComponent implements OnInit {
	@Output() selectedVariable: EventEmitter<{ value: Config; index: number }> = new EventEmitter<any>();
	@Input() configsListScope: ConfigScope;

	variables$: Observable<Config[]>;
	viewMode$: Observable<boolean>;

	constructor(private store: Store) {}

	ngOnInit(): void {
		this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
		if (this.configsListScope === ConfigScope.FLOW) {
			this.variables$ = this.store.select(BuilderSelectors.selectCurrentFlowConfigs);
		} else if (this.configsListScope === ConfigScope.COLLECTION) {
			this.variables$ = this.store.select(BuilderSelectors.selectCurrentCollectionConfigs);
		}
	}

	deleteVariable(index: number) {
		if (this.configsListScope === ConfigScope.FLOW) {
			this.store.dispatch(FlowsActions.deleteConfig({ configIndex: index }));
		} else if (this.configsListScope === ConfigScope.COLLECTION) {
			this.store.dispatch(PieceAction.deleteConfig({ configIndex: index }));
		}
	}
}
