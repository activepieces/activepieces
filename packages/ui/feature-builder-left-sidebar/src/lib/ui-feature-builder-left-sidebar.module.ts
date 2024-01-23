import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { SelectedStepResultComponent } from './run-details/selected-step-result/selected-step-result.component';
import { IterationAccordionComponent } from './run-details/steps-results-list/iteration-accordion/iteration-accordion.component';
import { StepResultComponent } from './run-details/steps-results-list/step-result.component';
import { RunDetailsComponent } from './run-details/run-details.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { FlowLeftSidebarComponent } from './flow-left-sidebar.component';
import { VersionHistoryComponent } from './version-history/version-history.component';
import { UseAsDraftConfirmationDialogComponent } from './dialogs/use-as-draft-confirmation-dialog/use-as-draft-confirmation-dialog.component';
@NgModule({
  imports: [CommonModule, UiCommonModule, MatExpansionModule],
  declarations: [
    SelectedStepResultComponent,
    FlowLeftSidebarComponent,
    IterationAccordionComponent,
    StepResultComponent,
    RunDetailsComponent,
    VersionHistoryComponent,
    UseAsDraftConfirmationDialogComponent,
  ],
  exports: [FlowLeftSidebarComponent],
})
export class UiFeatureBuilderLeftSidebarModule {}
