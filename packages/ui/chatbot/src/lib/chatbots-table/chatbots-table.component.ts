import { Component } from '@angular/core';
import { Observable, Subject, map, startWith, tap } from 'rxjs';
import { ChatBotsDataSource } from './chatbots-table.datasource';
import { Router } from '@angular/router';
import { Chatbot } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DeleteEntityDialogComponent, DeleteEntityDialogData, GenericSnackbarTemplateComponent } from '@activepieces/ui/common';
import { ChatBotService } from '../chatbot.service';

@Component({
  selector: 'activepieces-chatbots-table',
  templateUrl: './chatbots-table.component.html',
  styleUrls: [],
})
export class ChatbotsTableComponent {
  displayedColumns = ['displayName', 'action'];
  refreshTable$: Subject<boolean> = new Subject();
  dataSource!: ChatBotsDataSource;
  loading = true;
  createBot$: Observable<void> | undefined;
  deleteBot$: Observable<void> | undefined;
  constructor(private chatbotService: ChatBotService, private router: Router, private dialogService: MatDialog, private snackBar: MatSnackBar) {
    this.dataSource = new ChatBotsDataSource(
      this.chatbotService,
      this.refreshTable$.asObservable().pipe(startWith(true))
    );
  }

  createChatbot() {
    this.loading = true;
    this.createBot$ = this.chatbotService
      .create({
        type: 'custom-bot',
      })
      .pipe(
        tap((value) => {
          this.router.navigate(['/chatbots', value.id, 'settings']);
          this.loading = false;
        }),
        map(() => {})
      );
  }


  deleteChatbot(metadata: Chatbot) {
    const dialogRef = this.dialogService.open(DeleteEntityDialogComponent, {
      data: {
        deleteEntity$: this.chatbotService.delete(metadata.id!).pipe(
          tap(() => {
            this.refreshTable$.next(true);
          })
        ),
        entityName: metadata.displayName,
        note: `This will permanently delete this chatbot and all its data.`,
      } as DeleteEntityDialogData,
    });
    this.deleteBot$ = dialogRef.afterClosed().pipe(
      map((res) => {
        if (res) {
          this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: `<b>${metadata.displayName}</b> deleted`,
          });
        }
        return void 0;
      })
    );
  }

  openSettings(id: string) {
    this.router.navigate(['/chatbots', id, 'settings']);
  }

  openChatbot(id: string) {
    window.open(`/chatbots/${id}`, '_blank', 'noopener');
  }
}
