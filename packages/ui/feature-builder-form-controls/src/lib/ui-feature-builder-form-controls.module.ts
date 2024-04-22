import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureConnectionsModule } from '@activepieces/ui/feature-connections';
import { ArrayFormControlComponent } from './components/array-form-control/array-form-control.component';
import { ArrayFormControlTextItemComponent } from './components/array-form-control/array-form-control-text-item.component';
import { BranchConditionFormControlComponent } from './components/branch-condition-form-control/branch-condition-form-control.component';
import { BranchConditionsGroupFormControlComponent } from './components/branch-conditions-group-form-control/branch-conditions-group-form-control.component';
import { CodeArtifactFormControlComponent } from './components/code-artifact-form-control/code-artifact-form-control.component';
import { DictionaryFormControlComponent } from './components/dictionary-form-control/dictionary-form-control.component';
import { InterpolatingTextFormControlComponent } from './components/interpolating-text-form-control/interpolating-text-form-control.component';
import { AddNpmPackageModalComponent } from './components/code-artifact-form-control/code-artifact-control-fullscreen/add-npm-package-modal/add-npm-package-modal.component';
import { CodeArtifactControlFullscreenComponent } from './components/code-artifact-form-control/code-artifact-control-fullscreen/code-artifact-control-fullscreen.component';
import { MentionsListComponent } from './components/interpolating-text-form-control/mentions-list/mentions-list.component';
import { BuilderAutocompleteMentionsDropdownComponent } from './components/interpolating-text-form-control/builder-autocomplete-mentions-dropdown/builder-autocomplete-mentions-dropdown.component';
import { ActionMentionItemComponent } from './components/interpolating-text-form-control/mentions-list/action-mention-item/action-mention-item.component';
import { CustomPathMentionDialogComponent } from './components/interpolating-text-form-control/mentions-list/custom-path-mention-dialog/custom-path-mention-dialog.component';
import { GenericMentionItemComponent } from './components/interpolating-text-form-control/mentions-list/generic-mention-item/generic-mention-item.component';
import { GenericStepMentionItemComponent } from './components/interpolating-text-form-control/mentions-list/generic-step-mention-item/generic-step-mention-item.component';
import { MentionListItemTemplateComponent } from './components/interpolating-text-form-control/mentions-list/mention-list-item-template/mention-list-item-template.component';
import { PieceTriggerMentionItemComponent } from './components/interpolating-text-form-control/mentions-list/piece-trigger-mention-item/piece-trigger-mention-item.component';
import { StepMentionsTreeComponent } from './components/interpolating-text-form-control/mentions-list/step-mentions-tree/step-mentions-tree.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTreeModule } from '@angular/material/tree';
import { BuilderAutocompleteDropdownHandlerComponent } from './components/interpolating-text-form-control/builder-autocomplete-dropdown-handler/builder-autocomplete-dropdown-handler.component';
import { AutocompleteDropdownSizesButtonsComponent } from './components/interpolating-text-form-control/mentions-list/autocomplete-dropdown-sizes-buttons/autocomplete-dropdown-sizes-buttons.component';
import { MarkdownModule } from 'ngx-markdown';
import { SelectedAuthConfigsPipe } from './pipes/selected-auth-config.pipe';
import { init } from './components/interpolating-text-form-control/fixed-selection-mention';
import { UiFeaturePiecesModule } from '@activepieces/ui/feature-pieces';
import { DropdownPropertyInitialValuePipe } from './pipes/dropdown-initial-value.pipe';
import { isDropdownItemSelectedPipe } from './pipes/is-selected.pipe';
import { ActionErrorHandlingFormControlComponent } from './components/action-error-handling-form-control/action-error-handling-form-control.component';
import { PiecePropertiesFormComponent } from './components/new-piece-properties-form/piece-properties-form.component';
import { JsonControlComponent } from './components/json-control/json-control.component';
import { StaticDropdownControlComponent } from './components/static-dropdown-control/static-dropdown-control.component';
import { RefreshableDropdownControlComponent } from './components/refreshable-dropdown-control/refreshable-dropdown-control.component';
import { CheckboxControlComponent } from './components/checkbox-control/checkbox-control.component';
import { TextControlComponent } from './components/text-control/text-control.component';
import { ConnectionsDropdownControlComponent } from './components/connections-dropdown-control/connections-dropdown-control.component';
import { ReplaceMarkdownConstsPipe } from './pipes/replace-markdown-consts.pipe';
import { ExtractControlErrorMessagePipe } from './pipes/extract-error-message-from-form-control.pipe';
import { ActionOrTriggerDropdownComponent } from './components/action-or-trigger-dropdown/action-or-trigger-dropdown.component';
import { DynamicInputToggleComponent } from './components/dynamic-input-toggle/dynamic-input-toggle.component';
import { ShouldShowDynamicInputToggleAboveInputPipe } from './pipes/should-show-dynamic-input-toggle-above-input.pipe';
import { DynamicPropertyControlComponent } from './components/dynamic-property-control/dynamic-property-control.component';
import { FormGroupCasterPipe } from './pipes/form-group-caster.pipe';
import { IsAuthPropertyPipe } from './pipes/is-auth-property.pipe';
const exportedDeclarations = [
  ArrayFormControlComponent,
  BranchConditionFormControlComponent,
  BranchConditionsGroupFormControlComponent,
  CodeArtifactFormControlComponent,
  DictionaryFormControlComponent,
  BuilderAutocompleteMentionsDropdownComponent,
  ActionErrorHandlingFormControlComponent,
  PiecePropertiesFormComponent,
  DynamicPropertyControlComponent,
];
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    CodemirrorModule,
    BuilderAutocompleteDropdownHandlerComponent,
    ReactiveFormsModule,
    FormsModule,
    UiFeatureConnectionsModule,
    UiFeaturePiecesModule,
    MatTreeModule,
    MarkdownModule,
    InterpolatingTextFormControlComponent,
    JsonControlComponent,
    StaticDropdownControlComponent,
    RefreshableDropdownControlComponent,
    CheckboxControlComponent,
    TextControlComponent,
    ConnectionsDropdownControlComponent,
    ReplaceMarkdownConstsPipe,
    ExtractControlErrorMessagePipe,
    ActionOrTriggerDropdownComponent,
    DynamicInputToggleComponent,
    ShouldShowDynamicInputToggleAboveInputPipe,
    FormGroupCasterPipe,
    IsAuthPropertyPipe,
  ],
  declarations: [
    ...exportedDeclarations,
    ArrayFormControlTextItemComponent,
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
    AutocompleteDropdownSizesButtonsComponent,
    SelectedAuthConfigsPipe,
    DropdownPropertyInitialValuePipe,
    isDropdownItemSelectedPipe,
  ],
  exports: [
    ...exportedDeclarations,
    BuilderAutocompleteDropdownHandlerComponent,
    InterpolatingTextFormControlComponent,
    ActionOrTriggerDropdownComponent,
  ],
})
export class UiFeatureBuilderFormControlsModule {
  constructor() {
    init();
  }
}
