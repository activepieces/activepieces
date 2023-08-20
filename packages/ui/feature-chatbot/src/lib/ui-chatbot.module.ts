import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat/chat.component';
import { UiCommonModule } from '@activepieces/ui/common';
import { RouterModule } from '@angular/router';
import { ChatbotLayoutRoutes } from './ui-chatbot-routes';
import { ChatbotTypeComponent } from './chatbot-source-dialog/chatbot-source-dialog.component';
import { ChatbotSettingsComponent } from './chatbot-settings/chatbot-settings.component';
import { ChatbotsTableComponent } from './chatbots-table/chatbots-table.component';
import { AutosizeModule } from 'ngx-autosize';
import { UiFeatureConnectionsModule } from '@activepieces/ui/feature-connections';
import { appConnectionsReducer } from '@activepieces/ui/feature-builder-store';
import { StoreModule } from '@ngrx/store';
import { MatRadioModule } from '@angular/material/radio';
import { DatasourcesTableComponent } from './datasources-table/datasources-table.component';
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
  ],
  declarations: [
    ChatComponent,
    ChatbotTypeComponent,
    ChatbotSettingsComponent,
    ChatbotsTableComponent,
    DatasourcesTableComponent,
  ],
  exports: [
    ChatbotTypeComponent,
    ChatbotsTableComponent,
    ChatbotSettingsComponent,
  ],
})
export class UiChatbotModule {}
