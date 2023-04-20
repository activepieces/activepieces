import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { SelectedStepResultComponent } from './flow-left-sidebar/run-details/selected-step-result/selected-step-result.component';
import { FlowLeftSidebarComponent } from './flow-left-sidebar/flow-left-sidebar.component';
import { IterationAccordionComponent } from './flow-left-sidebar/run-details/steps-results-list/iteration-accordion/iteration-accordion.component';
import { StepResultComponent } from './flow-left-sidebar/run-details/steps-results-list/step-result.component';
import { RunDetailsComponent } from './flow-left-sidebar/run-details/run-details.component';
import { MatExpansionModule } from '@angular/material/expansion';

@NgModule({
  imports: [CommonModule, UiCommonModule, MatExpansionModule],
  declarations: [
    SelectedStepResultComponent,
    FlowLeftSidebarComponent,
    IterationAccordionComponent,
    StepResultComponent,
    RunDetailsComponent,
  ],
  exports: [FlowLeftSidebarComponent],
})
export class UiFeatureBuilderLeftSidebarModule {}
