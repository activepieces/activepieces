import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../../../common/service/theme.service';
import { TimeHelperService } from '../../../../../common/service/time-helper.service';
import { CollectionService } from '../../../../../common/service/collection.service';
import { RightSideBarType } from '../../../../../common/model/enum/right-side-bar-type.enum';
import { Store } from '@ngrx/store';
import { BuilderSelectors } from '../../../../store/builder/builder.selector';
import { FlowsActions } from '../../../../store/flow/flows.action';
import { map, Observable, switchMap, take } from 'rxjs';
import { CollectionVersion, CollectionVersionState } from 'shared';

@Component({
	selector: 'app-piece-version-sidebar',
	templateUrl: './collection-version-sidebar.component.html',
	styleUrls: ['./collection-version-sidebar.component.scss'],
})
export class CollectionVersionSidebarComponent implements OnInit {
	collectionVersionsList$: Observable<CollectionVersion[]>;
	constructor(
		public themeService: ThemeService,
		public timeHelperService: TimeHelperService,
		private store: Store,
		private pieceService: CollectionService
	) {}

	ngOnInit(): void {
		const selectedCollection$ = this.store.select(BuilderSelectors.selectCurrentCollection).pipe(take(1));
		this.collectionVersionsList$ = selectedCollection$.pipe(
			switchMap(collection => {
				return this.pieceService.listVersions(collection.id).pipe(
					map(versions => {
						return versions.reverse();
					})
				);
			})
		);
	}

	closeVersionSidebar() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.NONE,
				props: {},
			})
		);
	}

	get versionEditState() {
		return CollectionVersionState;
	}
}
