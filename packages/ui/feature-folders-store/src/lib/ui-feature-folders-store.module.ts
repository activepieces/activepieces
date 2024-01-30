import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { FOLDERS_STATE_NAME } from './store/folders.selectors';
import { foldersReducer } from './store/folders.reducer';
import { FoldersEffects } from './store/folders.effects';

@NgModule({
  imports: [CommonModule,
    StoreModule.forFeature(FOLDERS_STATE_NAME, foldersReducer),
    EffectsModule.forFeature([FoldersEffects]),],
})
export class UiFeatureFoldersStoreModule {}
