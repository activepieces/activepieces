import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { combineLatest, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { ProjectEnvironment } from 'src/app/layout/common-layout/model/project-environment.interface';
import { CollectionService } from 'src/app/layout/common-layout/service/collection.service';
import { EnvironmentSelectors } from 'src/app/layout/common-layout/store/selector/environment.selector';
import { BuilderSelectors } from 'src/app/layout/flow-builder/store/selector/flow-builder.selector';
import { Collection } from 'src/app/layout/common-layout/model/piece.interface';
import { SaveState } from 'src/app/layout/flow-builder/store/model/enums/save-state.enum';
import { Actions, ofType } from '@ngrx/effects';
import { FlowsActions } from 'src/app/layout/flow-builder/store/action/flows.action';
import { RightSideBarType } from 'src/app/layout/common-layout/model/enum/right-side-bar-type.enum';
import { PieceAction } from 'src/app/layout/flow-builder/store/action/piece.action';
import { VersionEditState } from 'src/app/layout/common-layout/model/enum/version-edit-state.enum';
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
	constructor(
		private store: Store,
		private formBuilder: FormBuilder,
		private collectionService: CollectionService,
		private actions$: Actions
	) {}

	executePublishBtnStyleInit() {
		this.executePublishBtnDisabled = true;
		this.excutePublishBtnText = 'Publish';
	}
	ngOnInit(): void {
		this.getProjectEnvironments();
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

	private setSelectedEnvironmentsListener() {
		this.selectedEnvironments$ = this.selectedEnvironmentsForm.valueChanges.pipe(
			map(() => {
				return this.getSelectedEnvironments();
			}),
			tap(selectedEnvironments => {
				if (selectedEnvironments.length > 0) {
					this.excutePublishBtnText = `Publish to ${selectedEnvironments.length}`;
					if (selectedEnvironments.length > 1) {
						this.excutePublishBtnText = `${this.excutePublishBtnText} environments`;
					} else {
						this.excutePublishBtnText = `${this.excutePublishBtnText} environment`;
					}
					this.executePublishBtnDisabled = false;
				} else {
					this.excutePublishBtnText = `Publish`;
					this.executePublishBtnDisabled = true;
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

	private getProjectEnvironments() {
		this.projectEnvironmentsAndCurrentCollection$ = combineLatest({
			environments: this.store.select(EnvironmentSelectors.selectEnvironments),
			collection: this.store.select(BuilderSelectors.selectCurrentCollection),
		}).pipe(
			tap(result => {
				const envrionmentsFormValueFromLastTimePopoverWasOpen = this.selectedEnvironmentsForm
					? this.getSelectedEnvironments()
					: [];
				this.createEnvironmentsForm(result);
				if (envrionmentsFormValueFromLastTimePopoverWasOpen) {
					envrionmentsFormValueFromLastTimePopoverWasOpen.forEach(envId => {
						this.selectedEnvironmentsForm.get(envId)!.setValue(true);
					});
				}
				this.setSelectedEnvironmentsListener();
			})
		);
	}

	private createEnvironmentsForm(environmentAndCollection: {
		environments: ProjectEnvironment[];
		collection: Collection;
	}) {
		this.collectionVersionSequenceForEachEnvironment.clear();
		const environmentsControls: { [key: string]: FormControl } = {};
		environmentAndCollection.environments.forEach(e => {
			const currentCollectionStateOnEnvrionment = e.deployedCollections.find(
				c => c.collectionId === environmentAndCollection.collection.id
			);
			if (currentCollectionStateOnEnvrionment) {
				const collectionVersionSequence = environmentAndCollection.collection.versionsList.findIndex(
					verId => currentCollectionStateOnEnvrionment.collectionVersionsId[0] === verId
				);
				this.collectionVersionSequenceForEachEnvironment.set(e.id, `V${collectionVersionSequence + 1}`);
				const isLatestCollectionVersionDeployedOnEnvrionment =
					environmentAndCollection.collection.lastVersion.id ===
					currentCollectionStateOnEnvrionment.collectionVersionsId[0];
				environmentsControls[e.id] = new FormControl({
					value: isLatestCollectionVersionDeployedOnEnvrionment,
					disabled: isLatestCollectionVersionDeployedOnEnvrionment,
				});
			} else {
				environmentsControls[e.id] = new FormControl(false);
			}
		});

		this.selectedEnvironmentsForm = this.formBuilder.group(environmentsControls);
	}

	getSelectedEnvironments() {
		const formValue: { [key: string]: boolean } = this.selectedEnvironmentsForm.value;
		const selectedEnvironmentsIds: string[] = [];
		for (const envId in formValue) {
			if (formValue[envId] && !this.selectedEnvironmentsForm.get(envId)!.disabled) {
				selectedEnvironmentsIds.push(envId);
			}
		}
		return selectedEnvironmentsIds;
	}

	publish() {
		this.executePublishBtnStyleInit();
		const currentCollection$ = this.store.select(BuilderSelectors.selectCurrentCollection).pipe(take(1));
		this.isPublishing = true;
		this.popoverToggleBtnText = 'Publishing';
		this.executePublish$ = currentCollection$.pipe(
			switchMap(collection => {
				if (collection.lastVersion.state === VersionEditState.DRAFT) {
					return this.collectionService.lock(collection.id);
				}
				return of(collection);
			}),
			tap(lockedCollection => {
				const environmentsControlValue: string[] = this.getSelectedEnvironments();
				this.store.dispatch(
					PieceAction.publishCollection({
						environmentIds: environmentsControlValue,
						collection: lockedCollection,
					})
				);
				this.publishing$ = of(true).pipe(
					switchMap(() => {
						return this.actions$.pipe(
							ofType(PieceAction.publishCollectionSuccess, PieceAction.publishCollectionFailed),
							take(1),
							tap(() => {
								this.excutePublishBtnText = 'Publish';
								this.executePublishBtnDisabled = true;
								this.clearEnvironmentsFormValue();
								if (!this.isSaving) {
									this.popoverToggleBtnText = 'Publish';
								}
								this.isPublishing = false;
							}),
							map(() => {
								return false;
							})
						);
					})
				);
			})
		);
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
				sidebarType: RightSideBarType.PIECE_VERSIONS,
				props: {},
			})
		);
	}
}
