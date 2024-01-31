import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { FOLDERS_STATE_NAME } from './store/folders.selectors';
import { foldersReducer } from './store/folders.reducer';
import { FoldersEffects } from './store/folders.effects';
import { MoveFlowToFolderDialogComponent } from './components/dialogs/move-flow-to-folder-dialog/move-flow-to-folder-dialog.component';
import { UiCommonModule } from '@activepieces/ui/common';

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    StoreModule.forFeature(FOLDERS_STATE_NAME, foldersReducer),
    EffectsModule.forFeature([FoldersEffects]),
  ],
  exports: [
    MoveFlowToFolderDialogComponent,
  ],
  declarations: [
    MoveFlowToFolderDialogComponent
  ]
})
export class UiFeatureFoldersStoreModule {}
