import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { InstallCommunityPieceModalComponent } from './install-community-piece/install-community-piece-modal.component';
import { CommunityPiecesTableComponent } from './community-pieces-table/community-pieces-table.component';
import { PieceIconContainerComponent } from './pieces-icons/piece-icon-container/piece-icon-container.component';
import { PiecesIconsFromFlowComponent } from './pieces-icons-from-flow/pieces-icons-from-flow.component';

const exportedComponents = [
  InstallCommunityPieceModalComponent, CommunityPiecesTableComponent, PieceIconContainerComponent, PiecesIconsFromFlowComponent
]
@NgModule({
  imports: [CommonModule, UiCommonModule],
  declarations: [...exportedComponents],
  exports: [...exportedComponents]
})
export class UiFeaturePiecesModule { }