import { Component, OnInit } from '@angular/core';
import { LeftSideBarType } from 'src/app/modules/common/model/enum/left-side-bar-type.enum';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../store/builder/builder.selector';

@Component({
	selector: 'app-flow-left-sidebar',
	templateUrl: './flow-left-sidebar.component.html',
	styleUrls: ['./flow-left-sidebar.component.css'],
})
export class FlowLeftSidebarComponent implements OnInit {
	leftSideBar$: Observable<LeftSideBarType>;

	constructor(private store: Store) {}

	ngOnInit(): void {
		this.leftSideBar$ = this.store.select(BuilderSelectors.selectCurrentLeftSidebarType);
	}

	get leftSideBarType() {
		return LeftSideBarType;
	}
}
