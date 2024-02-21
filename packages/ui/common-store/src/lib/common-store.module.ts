import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { ProjectEffects, appConnectionsReducer, projectReducer } from './store';
import { EffectsModule } from '@ngrx/effects';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('commonState', {
      projectsState: projectReducer,
      appConnectionsState: appConnectionsReducer,
    }),
    EffectsModule.forFeature([ProjectEffects]),
  ],
})
export class CommonStoreModule {}
