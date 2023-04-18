import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlowBuilderTabComponent } from './flow-builder-tabs/flow-builder-tab/flow-builder-tab.component';
import { FlowBuilderTabsComponent } from './flow-builder-tabs/flow-builder-tabs.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { UiFeatureBuilderStoreModule } from '@activepieces/ui/feature-builder-store';
import { TestFlowModalComponent } from './test-flow-modal/test-flow-modal.component';
import { DeleteFlowDialogComponent } from './flow-builder-tabs/flow-builder-tab/delete-flow-dialog/delete-flow-dialog.component';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    UiFeatureBuilderStoreModule,
    CodemirrorModule,
  ],
  declarations: [
    FlowBuilderTabComponent,
    FlowBuilderTabsComponent,
    TestFlowModalComponent,
    DeleteFlowDialogComponent,
  ],
  exports: [FlowBuilderTabsComponent],
})
export class UiFeatureBuilderTabsModule {}
