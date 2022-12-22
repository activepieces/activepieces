import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlowLayoutRouting } from './flow-builder.routing';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { FlowBuilderHeaderComponent } from './page/flow-builder/flow-builder-header/flow-builder-header.component';
import { FlowItemComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { FlowRightSidebarComponent } from './page/flow-builder/flow-right-sidebar/flow-right-sidebar.component';
import { FlowBuilderTabsComponent } from './page/flow-builder/flow-builder-tabs/flow-builder-tabs.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { BsModalService, ModalModule } from 'ngx-bootstrap/modal';
import { ChevronDropdownMenuComponent } from './components/chevron-dropdown-menu/chevron-dropdown-menu.component';
import { FlowBuilderTabComponent } from './page/flow-builder/flow-builder-tabs/flow-builder-tab/flow-builder-tab.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlowItemTreeComponent } from './page/flow-builder/flow-item-tree/flow-item-tree.component';
import { SimpleLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/simple-line-connection/simple-line-connection.component';
import { LoopLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/loop-line-connection/loop-line-connection.component';
import { StepResultComponent } from './page/flow-builder/flow-left-sidebar/run-details/steps-results-list/step-result.component';
import { SelectedStepResultComponent } from './page/flow-builder/flow-left-sidebar/run-details/selected-step-result/selected-step-result.component';
import { IterationAccordionComponent } from './page/flow-builder/flow-left-sidebar/run-details/steps-results-list/iteration-accordion/iteration-accordion.component';
import { NewEditPieceSidebarComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/new-edit-piece-sidebar.component';
import { StepTypeSidebarComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-sidebar.component';
import { MatTabsModule } from '@angular/material/tabs';
import { StepTypItemComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/step-type-item.component';
import { StepTypeListComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-list/step-type-list.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StoreModule } from '@ngrx/store';
import { collectionReducer } from './store/reducer/collection.reducer';
import { EffectsModule } from '@ngrx/effects';
import { CollectionEffects } from './store/effect/collection.effects';
import { flowsReducer } from './store/reducer/flows.reducer';
import { FlowsEffects } from './store/effect/flow.effects';
import { viewModeReducer } from './store/reducer/view-mode.reducer';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { VariableSidebarComponent } from './page/flow-builder/flow-left-sidebar/configs-sidebar/configs-sidebar.component';
import { ViewModeEffects } from './store/effect/viewMode.effects';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlowItemConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/flow-item-connection.component';
import { FlowItemContentComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-content/flow-item-content.component';
import { RunDetailsComponent } from './page/flow-builder/flow-left-sidebar/run-details/run-details.component';
import { TestFlowModalComponent } from './components/test-flow-modal/test-flow-modal.component';
import { FlowLeftSidebarComponent } from './page/flow-builder/flow-left-sidebar/flow-left-sidebar.component';
import { TestRunBarComponent } from './page/flow-builder/test-run-bar/test-run-bar.component';
import { SidebarHeaderComponent } from './components/sidebar-header/sidebar-header.component';
import { CollectionVersionSidebarComponent } from './page/flow-builder/flow-right-sidebar/collection-version-sidebar/collection-version-sidebar.component';
import { flowItemsDetailsReducer } from './store/reducer/flow-items-details.reducer';
import { FlowItemsDetailsEffects } from './store/effect/flow-items-details.effects';
import { EditStepAccordionComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/edit-step-accodion.component';
import { DescribeFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/describe-form/describe-form.component';
import { CodeStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/code-step-input-form/code-step-input-form.component';
import { StorageStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/storage-step-input-form/storage-step-input-form.component';
import { LoopStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/loop-step-input-form/loop-step-input-form.component';
import { ResponseStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/response-step-input-form/response-step-input-form.component';
import { ScheduleTriggerInputFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/schedule-trigger-input-form/schedule-trigger-input-form.component';
import { ConfigCardComponent } from './page/flow-builder/flow-left-sidebar/configs-sidebar/config-card/config-card.component';
import { VariableListComponent } from './page/flow-builder/flow-left-sidebar/configs-sidebar/configs-list/configs-list.component';
import { CreateEditConfigModalComponent } from './page/flow-builder/flow-left-sidebar/create-or-edit-config-modal/create-or-edit-config-modal.component';
import { DefaultConfigTypeSettingsComponent } from './page/flow-builder/flow-left-sidebar/create-or-edit-config-modal/default-config-type-settings/default-config-type-settings.component';
import { OAuth2ConfigSettingsComponent } from './page/flow-builder/flow-left-sidebar/create-or-edit-config-modal/o-auth2-config-settings/o-auth2-config-settings.component';
import { DeployButtonComponent } from './page/flow-builder/flow-builder-header/deploy-button/deploy-button.component';
import { TrackFocusDirective } from './page/flow-builder/flow-left-sidebar/run-details/steps-results-list/track-focus.directive';
import { CenterMatMenuDirective } from './components/chevron-dropdown-menu/center-mat-menu.directive';
import { InstanceSettingsComponent } from './page/flow-builder/flow-builder-header/instance-settings/instance-settings.component';
import { NewAuthenticationModalComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/component-input-forms/new-authentication-modal/new-authentication-modal.component';
import { ComponentActionInputFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/component-input-forms/componet-action-input-form/component-action-input-form.component';
import { ComponentTriggerInputFormComponent } from './page/flow-builder/flow-right-sidebar/new-edit-piece-sidebar/edit-step-accordion/input-forms/component-input-forms/component-trigger-input-form/component-trigger-input-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from './service/interceptor.service';

@NgModule({
	imports: [
		CommonModule,
		RouterModule.forChild(FlowLayoutRouting),
		FormsModule,
		ReactiveFormsModule,
		MatSidenavModule,
		CommonLayoutModule,
		CodemirrorModule,
		MatChipsModule,
		MatAutocompleteModule,
		MatFormFieldModule,
		MatIconModule,
		MatSelectModule,
		DragDropModule,
		ModalModule.forRoot(),
		TimepickerModule.forRoot(),
		AngularSvgIconModule.forRoot(),
		EffectsModule.forFeature([CollectionEffects, FlowsEffects, ViewModeEffects, FlowItemsDetailsEffects]),
		StoreModule.forFeature('builderState', {
			collectionState: collectionReducer,
			flowsState: flowsReducer,
			viewMode: viewModeReducer,
			flowItemsDetailsState: flowItemsDetailsReducer,
		}),
		TabsModule,
		FontAwesomeModule,
		MatExpansionModule,
		MatTabsModule,
		MatTooltipModule,
		MonacoEditorModule,
	],
	providers: [BsModalService, { provide: HTTP_INTERCEPTORS, useClass: HttpInterceptorService, multi: true }],
	declarations: [
		CollectionBuilderComponent,
		FlowBuilderHeaderComponent,
		FlowItemComponent,
		ChevronDropdownMenuComponent,
		FlowRightSidebarComponent,
		FlowBuilderTabsComponent,
		FlowBuilderTabComponent,
		FlowItemTreeComponent,
		FlowItemConnectionComponent,
		FlowItemContentComponent,
		FlowLeftSidebarComponent,
		VariableListComponent,
		TestFlowModalComponent,
		RunDetailsComponent,
		TestRunBarComponent,
		SidebarHeaderComponent,
		CollectionVersionSidebarComponent,
		NewEditPieceSidebarComponent,
		StepTypItemComponent,
		StepTypeListComponent,
		StepTypeSidebarComponent,
		CreateEditConfigModalComponent,
		VariableSidebarComponent,
		StepResultComponent,
		SimpleLineConnectionComponent,
		LoopLineConnectionComponent,
		SelectedStepResultComponent,
		IterationAccordionComponent,
		EditStepAccordionComponent,
		DescribeFormComponent,
		ResponseStepInputFormComponent,
		LoopStepInputFormComponent,
		StorageStepInputFormComponent,
		CodeStepInputFormComponent,
		ScheduleTriggerInputFormComponent,
		ConfigCardComponent,
		DefaultConfigTypeSettingsComponent,
		OAuth2ConfigSettingsComponent,
		ComponentActionInputFormComponent,
		NewAuthenticationModalComponent,
		DeployButtonComponent,
		TrackFocusDirective,
		CenterMatMenuDirective,
		InstanceSettingsComponent,
		ComponentTriggerInputFormComponent,
	],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	exports: [FlowBuilderHeaderComponent],
})
export class FlowLayoutModule {}
