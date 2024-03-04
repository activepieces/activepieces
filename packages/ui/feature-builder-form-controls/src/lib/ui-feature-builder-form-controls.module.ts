import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureConnectionsModule } from '@activepieces/ui/feature-connections';
import { ArrayFormControlComponent } from './array-form-control/array-form-control.component';
import { BranchConditionFormControlComponent } from './branch-condition-form-control/branch-condition-form-control.component';
import { BranchConditionsGroupFormControlComponent } from './branch-conditions-group-form-control/branch-conditions-group-form-control.component';
import { CodeArtifactFormControlComponent } from './code-artifact-form-control/code-artifact-form-control.component';
import { DictionaryFormControlComponent } from './dictionary-form-control/dictionary-form-control.component';
import { InterpolatingTextFormControlComponent } from './interpolating-text-form-control/interpolating-text-form-control.component';
import { AddNpmPackageModalComponent } from './code-artifact-form-control/code-artifact-control-fullscreen/add-npm-package-modal/add-npm-package-modal.component';
import { CodeArtifactControlFullscreenComponent } from './code-artifact-form-control/code-artifact-control-fullscreen/code-artifact-control-fullscreen.component';
import { MentionsListComponent } from './interpolating-text-form-control/mentions-list/mentions-list.component';
import { BuilderAutocompleteMentionsDropdownComponent } from './interpolating-text-form-control/builder-autocomplete-mentions-dropdown/builder-autocomplete-mentions-dropdown.component';
import { ActionMentionItemComponent } from './interpolating-text-form-control/mentions-list/action-mention-item/action-mention-item.component';
import { CustomPathMentionDialogComponent } from './interpolating-text-form-control/mentions-list/custom-path-mention-dialog/custom-path-mention-dialog.component';
import { GenericMentionItemComponent } from './interpolating-text-form-control/mentions-list/generic-mention-item/generic-mention-item.component';
import { GenericStepMentionItemComponent } from './interpolating-text-form-control/mentions-list/generic-step-mention-item/generic-step-mention-item.component';
import { MentionListItemTemplateComponent } from './interpolating-text-form-control/mentions-list/mention-list-item-template/mention-list-item-template.component';
import { PieceTriggerMentionItemComponent } from './interpolating-text-form-control/mentions-list/piece-trigger-mention-item/piece-trigger-mention-item.component';
import { StepMentionsTreeComponent } from './interpolating-text-form-control/mentions-list/step-mentions-tree/step-mentions-tree.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthConfigsPipe } from './pipes/auth-configs.pipe';
import { PiecePropertiesFormComponent } from './piece-properties-form/piece-properties-form.component';
import { MatTreeModule } from '@angular/material/tree';
import { QuillModule } from 'ngx-quill';
import { BuilderAutocompleteDropdownHandlerComponent } from './interpolating-text-form-control/builder-autocomplete-dropdown-handler/builder-autocomplete-dropdown-handler.component';
import { AutocompleteDropdownSizesButtonsComponent } from './interpolating-text-form-control/mentions-list/autocomplete-dropdown-sizes-buttons/autocomplete-dropdown-sizes-buttons.component';
import { MarkdownModule } from 'ngx-markdown';
import { SelectedAuthConfigsPipe } from './pipes/selected-auth-config.pipe';
import { init } from './interpolating-text-form-control/fixed-selection-mention';
import { UiFeaturePiecesModule } from '@activepieces/ui/feature-pieces';
import { DropdownPropertyInitialValuePipe } from './pipes/dropdown-initial-value.pipe';
import { isDropdownItemSelectedPipe } from './pipes/is-selected.pipe';
import { MatPseudoCheckboxModule } from '@angular/material/core';
import { ActionErrorHandlingFormControlComponent } from './action-error-handling-form-control/action-error-handling-form-control.component';
const exportedDeclarations = [
  ArrayFormControlComponent,
  BranchConditionFormControlComponent,
  BranchConditionsGroupFormControlComponent,
  CodeArtifactFormControlComponent,
  DictionaryFormControlComponent,
  InterpolatingTextFormControlComponent,
  PiecePropertiesFormComponent,
  BuilderAutocompleteMentionsDropdownComponent,
  BuilderAutocompleteDropdownHandlerComponent,
  ActionErrorHandlingFormControlComponent,
];
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    CodemirrorModule,

    ReactiveFormsModule,
    FormsModule,
    UiFeatureConnectionsModule,
    UiFeaturePiecesModule,
    MatTreeModule,
    QuillModule.forRoot({}),
    MarkdownModule,
    MatPseudoCheckboxModule,
  ],
  declarations: [
    ...exportedDeclarations,
    AddNpmPackageModalComponent,
    CodeArtifactControlFullscreenComponent,
    MentionsListComponent,
    ActionMentionItemComponent,
    CustomPathMentionDialogComponent,
    GenericMentionItemComponent,
    GenericStepMentionItemComponent,
    MentionListItemTemplateComponent,
    PieceTriggerMentionItemComponent,
    StepMentionsTreeComponent,
    AuthConfigsPipe,
    AutocompleteDropdownSizesButtonsComponent,
    SelectedAuthConfigsPipe,
    DropdownPropertyInitialValuePipe,
    isDropdownItemSelectedPipe,
  ],
  exports: [...exportedDeclarations],
})
export class UiFeatureBuilderFormControlsModule {
  constructor() {
    init();
  }
}
