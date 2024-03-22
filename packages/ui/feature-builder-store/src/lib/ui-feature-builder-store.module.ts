import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestRunBarComponent } from './test-run-bar/test-run-bar.component';
import { StoreModule } from '@ngrx/store';
import { flowsReducer } from './store/flow/flow.reducer';
import { viewModeReducer } from './store/builder/viewmode/view-mode.reducer';
import { UiCommonModule } from '@activepieces/ui/common';
import { FlowsEffects } from './store/flow/flow.effects';
import { ViewModeEffects } from './store/builder/viewmode/view-mode.effects';
import { EffectsModule } from '@ngrx/effects';
import { canvasReducer } from './store/builder/canvas/canvas.reducer';
import { CanvasEffects } from './store/builder/canvas/canvas.effects';

@NgModule({
  imports: [
    UiCommonModule,
    CommonModule,
    StoreModule.forFeature('builderState', {
      flowState: flowsReducer,
      viewMode: viewModeReducer,
      canvasState: canvasReducer,
    }),
    EffectsModule.forFeature([FlowsEffects, ViewModeEffects, CanvasEffects]),
  ],
  declarations: [TestRunBarComponent],
})
export class UiFeatureBuilderStoreModule {}
