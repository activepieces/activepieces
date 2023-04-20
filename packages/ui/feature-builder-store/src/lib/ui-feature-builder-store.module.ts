import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestRunBarComponent } from './test-run-bar/test-run-bar.component';
import { StoreModule } from '@ngrx/store';
import { collectionReducer } from './store/collection/collection.reducer';
import { flowsReducer } from './store/flow/flows.reducer';
import { viewModeReducer } from './store/builder/viewmode/view-mode.reducer';
import { flowItemsDetailsReducer } from './store/builder/flow-item-details/flow-items-details.reducer';
import { appConnectionsReducer } from './store/app-connections/app-connections.reducer';
import { UiCommonModule } from '@activepieces/ui/common';
import { CollectionEffects } from './store/collection/collection.effects';
import { FlowsEffects } from './store/flow/flow.effects';
import { ViewModeEffects } from './store/builder/viewmode/viewMode.effects';
import { FlowItemsDetailsEffects } from './store/builder/flow-item-details/flow-items-details.effects';
import { EffectsModule } from '@ngrx/effects';

@NgModule({
  imports: [
    UiCommonModule,
    CommonModule,
    StoreModule.forFeature('builderState', {
      collectionState: collectionReducer,
      flowsState: flowsReducer,
      viewMode: viewModeReducer,
      flowItemsDetailsState: flowItemsDetailsReducer,
      appConnectionsState: appConnectionsReducer,
    }),
    EffectsModule.forFeature([
      CollectionEffects,
      FlowsEffects,
      ViewModeEffects,
      FlowItemsDetailsEffects,
    ]),
  ],
  declarations: [TestRunBarComponent],
})
export class UiFeatureBuilderStoreModule {}
