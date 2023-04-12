import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@/ui/common/src';
import { SwitchFlowDialogComponent } from './switch-flow-dialog/switch-flow-dialog.component';

@NgModule({
  declarations: [SwitchFlowDialogComponent],
  exports: [SwitchFlowDialogComponent],
  imports: [CommonModule, UiCommonModule],
})
export class FeatureCommandBarModule {}
