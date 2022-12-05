import { Component, OnInit, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ConfirmDeleteModalComponent } from '../../../../common-layout/components/confirm-delete-modal/confirm-delete-modal.component';
import { Collection } from '../../../../common-layout/model/piece.interface';
import { CollectionBuilderService } from '../../../service/collection-builder.service';
import { RightSideBarType } from '../../../../common-layout/model/enum/right-side-bar-type.enum';
import { ThemeService } from 'src/app/layout/common-layout/service/theme.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { PieceAction } from '../../../store/action/piece.action';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { BuilderSelectors } from '../../../store/selector/flow-builder.selector';
import { SaveState } from '../../../store/model/enums/save-state.enum';
import { fadeIn400ms } from 'src/app/layout/common-layout/animation/fade-in.animations';
import { FlowsActions } from '../../../store/action/flows.action';
import {
	ChevronDropdownOption,
	ChevronDropdownOptionType,
} from '../../../components/chevron-dropdown-menu/chevron-dropdown-option';
import { PopoverDirective } from 'ngx-bootstrap/popover';
import { NavigationService } from 'src/app/layout/dashboard-layout/service/navigation.service';

@Component({
	selector: 'app-flow-builder-header',
	templateUrl: './flow-builder-header.component.html',
	styleUrls: ['./flow-builder-header.component.scss'],
	animations: [fadeIn400ms],
})
export class FlowBuilderHeaderComponent implements OnInit {
	@ViewChild(PopoverDirective) embeddedPopover: PopoverDirective;
	editing: boolean = false;
	bsModalRef: BsModalRef;
	collection$: Observable<Collection>;
	flowsCount$: Observable<number>;
	viewMode$: Observable<boolean>;
	disablePublishButton$: Observable<boolean>;
	saveState$: Observable<SaveState>;
	collectionActions$: Observable<ChevronDropdownOption[]>;
	publishButtonDisabledTooltip = '';
	newCollectionCheck$: Observable<Params>;
	collectionNameHovered = false;
	constructor(
		private store: Store,
		public themeService: ThemeService,
		private router: Router,
		private modalService: BsModalService,
		public collectionBuilderService: CollectionBuilderService,
		private route: ActivatedRoute,
		private navigationService: NavigationService
	) {}

	get saveState() {
		return SaveState;
	}

	ngOnInit(): void {
		this.saveState$ = this.store.select(BuilderSelectors.selectBuilderSaveState);
		this.collection$ = this.store.select(BuilderSelectors.selectCurrentCollection);
		this.flowsCount$ = this.store.select(BuilderSelectors.selectFlowsCount);
		this.viewMode$ = this.store.select(BuilderSelectors.selectReadOnly);
		this.disablePublishButton$ = combineLatest({
			saving: this.store.select(BuilderSelectors.selectSavingChangeState),
			valid: this.store.select(BuilderSelectors.selectCurrentFlowValidity),
		}).pipe(
			tap(res => {
				if (res.saving) {
					this.publishButtonDisabledTooltip = 'Please wait until saving is complete';
				} else if (!res.valid) {
					this.publishButtonDisabledTooltip = 'Please make sure all flows are valid';
				} else {
					this.publishButtonDisabledTooltip = '';
				}
			}),
			map(res => {
				return res.saving || !res.valid;
			})
		);
		this.collectionActions$ = this.collection$.pipe(
			map(piece => [
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
					name: piece.id.toString(),
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
		} else if (actionId === 'DELETE') {
			this.bsModalRef = this.modalService.show(ConfirmDeleteModalComponent);
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
		this.store.dispatch(PieceAction.changeName({ displayName: newPieceName }));
		this.navigationService.setTitle(newPieceName);
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

	calculateCollectionNameEditorPosition(collectionNameEditorDiv: HTMLElement) {
		const rect = collectionNameEditorDiv.getBoundingClientRect();
		return {
			left: `calc(50% - ${rect.width / 2}px)`,
			top: `calc(50% - ${rect.height / 2}px)`,
		};
	}
}
