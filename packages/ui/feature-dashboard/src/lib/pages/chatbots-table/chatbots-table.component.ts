import { Component } from '@angular/core';
import { Subject, startWith } from 'rxjs';
import { ChatBotsDataSource } from './chatbots-table.datasource';
import { ChatBotService } from '@activepieces/ui/chatbot';
import { MatDialog } from '@angular/material/dialog';
import { ChatbotTypeComponent } from 'packages/ui/chatbot/src/lib/chatbot-type/chatbot-type.component';

@Component({
  selector: 'activepieces-chatbots-table',
  templateUrl: './chatbots-table.component.html',
  styleUrls: []
})
export class ChatbotsTableComponent {
  displayedColumns = [ 'displayName', 'action'];
  refreshTable$: Subject<boolean> = new Subject();
  dataSource!: ChatBotsDataSource;
  constructor(
    private chatbotService: ChatBotService,
    private matDialog: MatDialog
  ) {
    this.dataSource = new ChatBotsDataSource(
      this.chatbotService,
      this.refreshTable$.asObservable().pipe(startWith(true))
    );
  }

  createChatbot() {
    this.matDialog.open(ChatbotTypeComponent);
  }
  openChatbot(id: string) {
    window.open(`/chatbots/${id}`, '_blank', 'noopener');
  }

}
