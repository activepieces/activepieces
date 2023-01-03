import { Component, OnInit } from '@angular/core';
import { RightSideBarType } from '../../../../common/model/enum/right-side-bar-type.enum';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../store/selector/flow-builder.selector';

@Component({
	selector: 'app-flow-right-sidebar',
	templateUrl: './flow-right-sidebar.component.html',
	styleUrls: [],
})
export class FlowRightSidebarComponent implements OnInit {
	rightSidebarType$: Observable<RightSideBarType>;

	constructor(private store: Store) {}

	ngOnInit(): void {
		this.rightSidebarType$ = this.store.select(BuilderSelectors.selectCurrentRightSideBarType);
	}

	get sidebarType() {
		return RightSideBarType;
	}
}
