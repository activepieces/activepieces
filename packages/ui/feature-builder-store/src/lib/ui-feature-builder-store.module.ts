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
  ],
  declarations: [TestRunBarComponent],
})
export class UiFeatureBuilderStoreModule {}
