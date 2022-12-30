import { Component, OnInit } from '@angular/core';
import { Collection } from '../../../../common/model/collection.interface';
import { CollectionBuilderService } from '../../../service/collection-builder.service';
import { RightSideBarType } from '../../../../common/model/enum/right-side-bar-type.enum';
import { ThemeService } from 'src/app/modules/common/service/theme.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { CollectionActions } from '../../../store/action/collection.action';
import { map, Observable, tap } from 'rxjs';
import { BuilderSelectors } from '../../../store/selector/flow-builder.selector';
import { fadeIn400ms } from 'src/app/modules/common/animation/fade-in.animations';
import { FlowsActions } from '../../../store/action/flows.action';
import {
	ChevronDropdownOption,
	ChevronDropdownOptionType,
} from '../../../components/chevron-dropdown-menu/chevron-dropdown-option';

@Component({
	selector: 'app-flow-builder-header',
	templateUrl: './flow-builder-header.component.html',
	styleUrls: ['./flow-builder-header.component.scss'],
	animations: [fadeIn400ms],
})
export class FlowBuilderHeaderComponent implements OnInit {
	editing: boolean = false;
	collection$: Observable<Collection>;
	flowsCount$: Observable<number>;
	viewMode$: Observable<boolean>;
	collectionActions$: Observable<ChevronDropdownOption[]>;
	newCollectionCheck$: Observable<Params>;
	collectionNameHovered = false;
	constructor(
		private store: Store,
		public themeService: ThemeService,
		private router: Router,
		public collectionBuilderService: CollectionBuilderService,
		private route: ActivatedRoute
	) {}

	ngOnInit(): void {
		this.collection$ = this.store.select(BuilderSelectors.selectCurrentCollection);
		this.flowsCount$ = this.store.select(BuilderSelectors.selectFlowsCount);
		this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
		this.collectionActions$ = this.collection$.pipe(
			map(collection => [
				{
					id: 'RENAME',
					name: 'Rename',
					cssClasses: '',
					type: ChevronDropdownOptionType.NORMAL,
				},
				{
					id: 'VERSIONS',
					name: 'Versions',
					cssClasses: '',
					type: ChevronDropdownOptionType.NORMAL,
				},
				{
					id: 'SEP_1',
					type: ChevronDropdownOptionType.SEPARATOR,
					cssClasses: '',
				},
				{
					id: 'COPY_ID',
					name: collection.id.toString(),
					cssClasses: '',
					type: ChevronDropdownOptionType.COPY_ID,
				},
			])
		);
		this.newCollectionCheck$ = this.route.queryParams.pipe(
			tap(params => {
				if (params['newCollection']) {
					this.editing = true;
				}
			})
		);
	}
	actionHandler(actionId: string) {
		if (actionId === 'VERSIONS') {
			this.openCollectionVersionsLists();
		} else if (actionId === 'RENAME') {
			this.editing = true;
		}
	}

	openCollectionVersionsLists() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.COLLECTION_VERSIONS,
				props: {},
			})
		);
	}

	changeEditValue(event: boolean) {
		this.editing = event;
	}

	savePieceName(newPieceName: string) {
		this.store.dispatch(CollectionActions.changeName({ displayName: newPieceName }));
	}

	redirectHome(newWindow: boolean) {
		if (newWindow) {
			const url = this.router.serializeUrl(this.router.createUrlTree([``]));
			window.open(url, '_blank');
		} else {
			const urlArrays = this.router.url.split('/');
			urlArrays.splice(urlArrays.length - 1, 1);
			const fixedUrl = urlArrays.join('/');
			this.router.navigate([fixedUrl]);
		}
	}
}
