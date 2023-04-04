import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FlowLayoutRouting } from './flow-builder.routing';
import { CollectionBuilderComponent } from './page/flow-builder/collection-builder.component';
import { FlowItemComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item.component';
import { FlowRightSidebarComponent } from './page/flow-builder/flow-right-sidebar/flow-right-sidebar.component';
import { CommonLayoutModule } from '../common/common-layout.module';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { ViewModeEffects } from './store/builder/viewmode/viewMode.effects';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { FlowItemConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/flow-item-connection.component';
import { FlowItemContentComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-content/flow-item-content.component';
import { RunDetailsComponent } from './page/flow-builder/flow-left-sidebar/run-details/run-details.component';
import { FlowLeftSidebarComponent } from './page/flow-builder/flow-left-sidebar/flow-left-sidebar.component';
import { TestRunBarComponent } from './page/flow-builder/test-run-bar/test-run-bar.component';
import { flowItemsDetailsReducer } from './store/builder/flow-item-details/flow-items-details.reducer';
import { FlowItemsDetailsEffects } from './store/builder/flow-item-details/flow-items-details.effects';
import { EditStepAccordionComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/edit-step-accodion.component';
import { CodeStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/code-step-input-form/code-step-input-form.component';
import { LoopStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/loop-step-input-form/loop-step-input-form.component';
import { TrackFocusDirective } from './page/flow-builder/flow-left-sidebar/run-details/steps-results-list/track-focus.directive';
import { OAuth2ConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/oauth2-connection-dialog/oauth2-connection-dialog.component';
import { PieceActionInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-action-input-form/piece-action-input-form.component';
import { PieceTriggerInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/piece-trigger-input-form/piece-trigger-input-form.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from './service/interceptor.service';
import { MatTabsModule } from '@angular/material/tabs';
import { DeleteStepDialogComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-content/delete-step-dialog/delete-step-dialog.component';
import { CloudOAuth2ConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/cloud-oauth2-connection-dialog/cloud-oauth2-connection-dialog.component';
import { appConnectionsReducer } from './store/app-connections/app-connections.reducer';
import { SecretTextConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/secret-text-connection-dialog/secret-text-connection-dialog.component';
import { BasicAuthConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/basic-auth-connection-dialog/basic-auth-connection-dialog.component';
import { BranchLineConnectionComponent } from './page/flow-builder/flow-item-tree/flow-item/flow-item-connection/branch-line-connection/branch-line-connection.component';
import { CanvasPannerDirective } from './page/flow-builder/canvas-utils/panning/panner.directive';
import { BranchStepInputFormComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/branch-step-input-form/branch-step-input-form.component';
import { CanvasUtilsComponent } from './page/flow-builder/canvas-utils/canvas-utils.component';
import { HorizontalSidebarSeparatorComponent } from './page/flow-builder/canvas-utils/horizontal-sidebar-separator/horizontal-sidebar-separator.component';
import { TestingStepsAndTriggersModule } from '../testing-steps-and-triggers/testing-steps-and-triggers.module';
import { StepNameEditorComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/step-name-editor/step-name-editor.component';
import { CustomAuthConnectionDialogComponent } from './page/flow-builder/flow-right-sidebar/edit-step-sidebar/edit-step-accordion/input-forms/piece-input-forms/custom-auth-connection-dialog/custom-auth-connection-dialog.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderTabsModule } from '@activepieces/ui/feature-builder-tabs';
import { UiFeatureBuilderHeaderModule } from '@activepieces/ui/feature-builder-header';

@NgModule({
  imports: [
    UiFeatureBuilderHeaderModule,
    CommonModule,
    RouterModule.forChild(FlowLayoutRouting),
    FormsModule,
    ReactiveFormsModule,
    CommonLayoutModule,
    UiCommonModule,
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
    TestingStepsAndTriggersModule,
    UiFeatureBuilderTabsModule,
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
    FlowItemComponent,
    FlowRightSidebarComponent,
    FlowItemTreeComponent,
    FlowItemConnectionComponent,
    FlowItemContentComponent,
    FlowLeftSidebarComponent,
    RunDetailsComponent,
    TestRunBarComponent,
    NewEditPieceSidebarComponent,
    StepTypItemComponent,
    StepTypeListComponent,
    StepTypeSidebarComponent,
    StepResultComponent,
    SimpleLineConnectionComponent,
    LoopLineConnectionComponent,
    SelectedStepResultComponent,
    IterationAccordionComponent,
    EditStepAccordionComponent,
    LoopStepInputFormComponent,
    CodeStepInputFormComponent,
    PieceActionInputFormComponent,
    OAuth2ConnectionDialogComponent,
    TrackFocusDirective,
    PieceTriggerInputFormComponent,
    DeleteStepDialogComponent,
    CloudOAuth2ConnectionDialogComponent,
    SecretTextConnectionDialogComponent,
    BasicAuthConnectionDialogComponent,
    BranchLineConnectionComponent,
    CanvasPannerDirective,
    BranchStepInputFormComponent,
    CanvasUtilsComponent,
    HorizontalSidebarSeparatorComponent,
    StepNameEditorComponent,
    CustomAuthConnectionDialogComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  exports: [],
})
export class FlowBuilderModule {}
