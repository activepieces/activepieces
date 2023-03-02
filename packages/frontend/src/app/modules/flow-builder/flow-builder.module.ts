import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlowLayoutRouting } from './flow-builder.routing';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { FlowBuilderHeaderComponent } from './page/flow-builder/flow-builder-header/flow-builder-header.component';
import { FlowItemComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item.component';
import { FlowRightSidebarComponent } from './page/flow-builder/flow-right-sidebar/flow-right-sidebar.component';
import { FlowBuilderTabsComponent } from './page/flow-builder/flow-builder-tabs/flow-builder-tabs.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { ChevronDropdownMenuComponent } from './components/chevron-dropdown-menu/chevron-dropdown-menu.component';
import { FlowBuilderTabComponent } from './page/flow-builder/flow-builder-tabs/flow-builder-tab/flow-builder-tab.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlowItemTreeComponent } from './page/flow-builder/flow-item-tree/flow-item-tree.component';
import { SimpleLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/simple-line-connection/simple-line-connection.component';
import { LoopLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/loop-line-connection/loop-line-connection.component';
import { StepResultComponent } from './page/flow-builder/flow-left-sidebar/run-details/steps-results-list/step-result.component';
import { SelectedStepResultComponent } from './page/flow-builder/flow-left-sidebar/run-details/selected-step-result/selected-step-result.component';
import { IterationAccordionComponent } from './page/flow-builder/flow-left-sidebar/run-details/steps-results-list/iteration-accordion/iteration-accordion.component';
import { NewEditPieceSidebarComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-sidebar.component';
import { StepTypeSidebarComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-sidebar.component';
import { StepTypItemComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/step-type-item.component';
import { StepTypeListComponent } from './page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-list/step-type-list.component';
import { StoreModule } from '@ngrx/store';
import { collectionReducer } from './store/collection/collection.reducer';
import { EffectsModule } from '@ngrx/effects';
import { CollectionEffects } from './store/collection/collection.effects';
import { flowsReducer } from './store/flow/flows.reducer';
import { FlowsEffects } from './store/flow/flow.effects';
import { viewModeReducer } from './store/builder/viewmode/view-mode.reducer';
import { MonacoEditorModule } from '@materia-ui/ngx-monaco-editor';
import { VariableSidebarComponent } from './page/flow-builder/flow-left-sidebar/configs-sidebar/configs-sidebar.component';
import { ViewModeEffects } from './store/builder/viewmode/viewMode.effects';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlowItemConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/flow-item-connection.component';
import { FlowItemContentComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-content/flow-item-content.component';
import { RunDetailsComponent } from './page/flow-builder/flow-left-sidebar/run-details/run-details.component';
import { TestFlowModalComponent } from './components/test-flow-modal/test-flow-modal.component';
import { FlowLeftSidebarComponent } from './page/flow-builder/flow-left-sidebar/flow-left-sidebar.component';
import { TestRunBarComponent } from './page/flow-builder/test-run-bar/test-run-bar.component';
import { SidebarHeaderComponent } from './components/sidebar-header/sidebar-header.component';
import { flowItemsDetailsReducer } from './store/builder/flow-item-details/flow-items-details.reducer';
import { FlowItemsDetailsEffects } from './store/builder/flow-item-details/flow-items-details.effects';
import { EditStepAccordionComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/edit-step-accodion.component';
import { DescribeFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/describe-form/describe-form.component';
import { CodeStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/code-step-input-form/code-step-input-form.component';
import { LoopStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/loop-step-input-form/loop-step-input-form.component';
import { ScheduleTriggerInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/schedule-trigger-input-form/schedule-trigger-input-form.component';
import { ConfigCardComponent } from './page/flow-builder/flow-left-sidebar/configs-sidebar/config-card/config-card.component';
import { VariableListComponent } from './page/flow-builder/flow-left-sidebar/configs-sidebar/configs-list/configs-list.component';
import { CreateEditConfigModalComponent } from './page/flow-builder/flow-left-sidebar/create-or-edit-config-modal/create-or-edit-config-modal.component';
import { PublishButtonComponent } from './page/flow-builder/flow-builder-header/publish-button/publish-button.component';
import { TrackFocusDirective } from './page/flow-builder/flow-left-sidebar/run-details/steps-results-list/track-focus.directive';
import { CenterMatMenuDirective } from './components/chevron-dropdown-menu/center-mat-menu.directive';
import { OAuth2ConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/oauth2-connection-dialog/oauth2-connection-dialog.component';
import { PieceActionInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-action-input-form/piece-action-input-form.component';
import { PieceTriggerInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-trigger-input-form/piece-trigger-input-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from './service/interceptor.service';
import { MatTabsModule } from '@angular/material/tabs';
import { DeleteFlowDialogComponent } from './page/flow-builder/flow-builder-tabs/flow-builder-tab/delete-flow-dialog/delete-flow-dialog.component';
import { DeleteStepDialogComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-content/delete-step-dialog/delete-step-dialog.component';
import { ToggleInstanceStateComponent } from './page/flow-builder/flow-builder-header/toggle-instance-state/toggle-instance-state.component';
import { CloudOAuth2ConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/cloud-oauth2-connection-dialog/cloud-oauth2-connection-dialog.component';
import { appConnectionsReducer } from './store/app-connections/app-connections.reducer';
import { SecretTextConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/secret-text-connection-dialog/secret-text-connection-dialog.component';
import { BasicAuthConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/basic-auth-connection-dialog/basic-auth-connection-dialog.component';
import { FeedbackComponent } from './page/flow-builder/flow-builder-header/feedback/feedback.component';
import { BranchLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/branch-line-connection/branch-line-connection.component';
import { CanvasPannerDirective } from './page/flow-builder/flow-item-tree/flow-item/panning/panner.directive';
import { CanvasZoomingDirective } from './page/flow-builder/flow-item-tree/flow-item/zooming/zooming.directive';
import { BranchStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/branch-step-input-form/branch-step-input-form.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(FlowLayoutRouting),
    FormsModule,
    ReactiveFormsModule,
    CommonLayoutModule,
    CodemirrorModule,
    DragDropModule,
    AngularSvgIconModule.forRoot(),
    EffectsModule.forFeature([
      CollectionEffects,
      FlowsEffects,
      ViewModeEffects,
      FlowItemsDetailsEffects,
    ]),
    StoreModule.forFeature('builderState', {
      collectionState: collectionReducer,
      flowsState: flowsReducer,
      viewMode: viewModeReducer,
      flowItemsDetailsState: flowItemsDetailsReducer,
      appConnectionsState: appConnectionsReducer,
    }),
    FontAwesomeModule,
    MatExpansionModule,
    MonacoEditorModule,
    MatTabsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true,
    },
  ],
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
    LoopStepInputFormComponent,
    CodeStepInputFormComponent,
    ScheduleTriggerInputFormComponent,
    ConfigCardComponent,
    PieceActionInputFormComponent,
    OAuth2ConnectionDialogComponent,
    PublishButtonComponent,
    TrackFocusDirective,
    CenterMatMenuDirective,
    PieceTriggerInputFormComponent,
    DeleteFlowDialogComponent,
    DeleteStepDialogComponent,
    ToggleInstanceStateComponent,
    CloudOAuth2ConnectionDialogComponent,
    SecretTextConnectionDialogComponent,
    BasicAuthConnectionDialogComponent,
    FeedbackComponent,
    BranchLineConnectionComponent,
    CanvasPannerDirective,
    CanvasZoomingDirective,
    BranchStepInputFormComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [FlowBuilderHeaderComponent],
})
export class FlowBuilderModule {}
