import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat/chat.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { RouterModule } from '@angular/router';
import { ChatbotLayoutRoutes } from './ui-chatbot-routes';
import { ChatbotDataSourceDialogComponent } from './chatbot-source-dialog/chatbot-source-dialog.component';
import { ChatbotSettingsComponent } from './chatbot-settings/chatbot-settings.component';
import { ChatbotsTableComponent } from './chatbots-table/chatbots-table.component';
import { AutosizeModule } from 'ngx-autosize';
import { UiFeatureConnectionsModule } from '@activepieces/ui/feature-connections';
import { appConnectionsReducer } from '@activepieces/ui/feature-builder-store';
import { StoreModule } from '@ngrx/store';
import { MatRadioModule } from '@angular/material/radio';
import { DatasourcesTableComponent } from './datasources-table/datasources-table.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { DataSourceUrlExtractorPipe } from './data-source-url-extractor.pipe';
import { GetInterpolatedConnectionNameFromConnectionIdPipe } from './interpolate-connection-name-from-connection-id.pipe';
@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    RouterModule.forChild(ChatbotLayoutRoutes),
    AutosizeModule,
    UiFeatureConnectionsModule,
    StoreModule.forFeature('builderState', {
      appConnectionsState: appConnectionsReducer,
    }),
    MatRadioModule,
    MatExpansionModule,
  ],
  declarations: [
    ChatComponent,
    ChatbotDataSourceDialogComponent,
    ChatbotSettingsComponent,
    ChatbotsTableComponent,
    DatasourcesTableComponent,
    DataSourceUrlExtractorPipe,
    GetInterpolatedConnectionNameFromConnectionIdPipe,
  ],
  exports: [
    ChatbotDataSourceDialogComponent,
    ChatbotsTableComponent,
    ChatbotSettingsComponent,
  ],
})
export class UiChatbotModule {}
