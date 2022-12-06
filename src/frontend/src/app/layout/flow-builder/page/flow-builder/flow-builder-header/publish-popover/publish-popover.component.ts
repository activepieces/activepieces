import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of, take, tap } from 'rxjs';
import { ProjectEnvironment } from 'src/app/layout/common-layout/model/project-environment.interface';

import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { Collection } from 'src/app/layout/common-layout/model/piece.interface';
import { SaveState } from 'src/app/layout/flow-builder/store/model/enums/save-state.enum';

import { FlowsActions } from 'src/app/layout/flow-builder/store/action/flows.action';
import { RightSideBarType } from 'src/app/layout/common-layout/model/enum/right-side-bar-type.enum';

@Component({
	selector: 'app-publish-popover',
	templateUrl: './publish-popover.component.html',
	styleUrls: ['./publish-popover.component.scss'],
})
export class PublishPopoverComponent implements OnInit {
	projectEnvironmentsAndCurrentCollection$: Observable<{ environments: ProjectEnvironment[]; collection: Collection }>;
	selectedEnvironmentsForm: FormGroup;
	executePublish$: Observable<Collection>;
	saving$: Observable<SaveState>;
	isSaving: boolean = false;
	isPublishing: boolean = false;
	publishing$: Observable<boolean> = of(false);
	allFlowsValid$: Observable<boolean>;
	popoverToggleBtnText = 'Publish';
	excutePublishBtnText = 'Publish';
	tooltipText = 'Publish Collection';
	executePublishBtnDisabled = true;
	aFlowIsInvalid = false;
	collectionVersionSequenceForEachEnvironment = new Map<string, string>();
	selectedEnvironments$: Observable<string[]>;
	constructor(private store: Store) {}

	executePublishBtnStyleInit() {
		this.executePublishBtnDisabled = true;
		this.excutePublishBtnText = 'Publish';
	}
	ngOnInit(): void {
		this.getSavingState();
		this.executePublishBtnStyleInit();
		this.allFlowsValid$ = this.store.select(BuilderSelectors.selectFlowsValidity).pipe(
			tap(valid => {
				this.aFlowIsInvalid = !valid;
				if (this.aFlowIsInvalid) {
					this.tooltipText = 'Please make sure all flows are valid';
				} else {
					this.tooltipText = 'Publish Collection';
				}
			})
		);
	}

	private getSavingState() {
		this.saving$ = this.store.select(BuilderSelectors.selectBuilderSaveState).pipe(
			tap(state => {
				if (state === SaveState.SAVING) {
					this.popoverToggleBtnText = 'Saving';
					this.isSaving = true;
				} else {
					if (this.isPublishing) {
						this.popoverToggleBtnText = 'Publishing';
					} else {
						this.popoverToggleBtnText = 'Publish';
					}
					this.isSaving = false;
				}
			})
		);
	}

	publish() {
		this.executePublishBtnStyleInit();
		const currentCollection$ = this.store.select(BuilderSelectors.selectCurrentCollection).pipe(take(1));
		this.isPublishing = true;
		this.popoverToggleBtnText = 'Publishing';
		currentCollection$;
	}
	clearEnvironmentsFormValue() {
		const controls = this.selectedEnvironmentsForm.controls;
		const controlsNames = Object.keys(controls);
		controlsNames.forEach(cn => {
			this.selectedEnvironmentsForm.get(cn)!.setValue(false);
		});
	}
	openVersionsList() {
		this.store.dispatch(
			FlowsActions.setRightSidebar({
				sidebarType: RightSideBarType.COLLECTION_VERSIONS,
				props: {},
			})
		);
	}
}
