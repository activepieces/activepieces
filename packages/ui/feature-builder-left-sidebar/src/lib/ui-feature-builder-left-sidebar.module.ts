import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { SelectedStepResultComponent } from './components/run-details/selected-step-result/selected-step-result.component';
import { IterationAccordionComponent } from './components/run-details/steps-results-list/iteration-accordion/iteration-accordion.component';
import { StepResultComponent } from './components/run-details/steps-results-list/step-result.component';
import { RunDetailsComponent } from './components/run-details/run-details.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { FlowLeftSidebarComponent } from './flow-left-sidebar.component';
import { VersionHistoryComponent } from './components/version-history/version-history.component';
import { UseAsDraftConfirmationDialogComponent } from './components/dialogs/use-as-draft-confirmation-dialog/use-as-draft-confirmation-dialog.component';
import { RunsListComponent } from './components/runs-list/runs-list.component';
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
    RunsListComponent,
  ],
  exports: [FlowLeftSidebarComponent],
})
export class UiFeatureBuilderLeftSidebarModule {}
