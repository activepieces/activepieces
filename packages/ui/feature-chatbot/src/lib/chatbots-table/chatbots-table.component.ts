import { Component } from '@angular/core';
import {
  Observable,
  Subject,
  catchError,
  map,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { ChatBotsDataSource } from './chatbots-table.datasource';
import { Router } from '@angular/router';
import { Chatbot, VisibilityStatus } from '@activepieces/shared';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  DeleteEntityDialogComponent,
  DeleteEntityDialogData,
  FlagService,
  GenericSnackbarTemplateComponent,
} from '@activepieces/ui/common';
import { ChatBotService } from '../chatbot.service';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-chatbots-table',
  templateUrl: './chatbots-table.component.html',
  styleUrls: [],
})
export class ChatbotsTableComponent {
  readonly VisiblityStatus = VisibilityStatus;
  displayedColumns = ['displayName', 'action'];
  refreshTable$: Subject<boolean> = new Subject();
  dataSource!: ChatBotsDataSource;
  loading = true;
  createBot$: Observable<void> | undefined;
  deleteBot$: Observable<void> | undefined;
  updateBot$: Observable<void> | undefined;
  copyChatbotUrl$: Observable<string> | undefined;
  updatingBot = false;
  constructor(
    private chatbotService: ChatBotService,
    private router: Router,
    private dialogService: MatDialog,
    private snackBar: MatSnackBar,
    private flagsService: FlagService
  ) {
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
        catchError((err: HttpErrorResponse) => {
          if (err.status === HttpStatusCode.PaymentRequired) {
            const snackbar = this.snackBar.open(
              $localize`You exceeded your quota for creating bots`,
              'Plans'
            );
            return snackbar.onAction().pipe(
              tap(() => {
                this.router.navigate(['/settings']);
              }),
              map(() => void 0)
            );
          } else {
            const snackbar = this.snackBar.open(
                $localize`Unexpected error occured, please contact support`,
              'Support',
              {
                panelClass: 'error',
                duration: undefined,
              }
            );
            return snackbar.onAction().pipe(
              tap(() => {
                window.open(
                  'https://community.activepieces.com/c/bugs',
                  '_blank',
                  'noreferer noopener'
                );
              }),
              map(() => void 0)
            );
          }
        }),
        map(() => void 0)
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
        note: $localize`This will permanently delete this chatbot and all its data.`,
      } as DeleteEntityDialogData,
    });
    this.deleteBot$ = dialogRef.afterClosed().pipe(
      map((res) => {
        if (res) {
          this.snackBar.openFromComponent(GenericSnackbarTemplateComponent, {
            data: $localize`<b>${metadata.displayName}</b> deleted`,
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
  copyChatbotUrl(chatbot: Chatbot) {
    this.copyChatbotUrl$ = this.flagsService.getFrontendUrl().pipe(
      tap((url) => {
        navigator.clipboard.writeText(`${url}/chatbots/${chatbot.id}`);
        this.snackBar.open(`${chatbot.displayName} url copied.`);
      })
    );
  }
  enablePublicSharingForBot(chatbot: Chatbot, menuTrigger: MatMenuTrigger) {
    if (!this.updatingBot) {
      this.updatingBot = true;
      this.updateBot$ = this.chatbotService
        .update(chatbot.id, {
          ...chatbot,
          visibilityStatus: VisibilityStatus.PUBLIC,
        })
        .pipe(
          catchError((err) => {
            console.error(err);
            menuTrigger.closeMenu();
            const snackbar = this.snackBar.open(
                $localize`Unexpected error occured, please contact support`,
              'Support',
              {
                panelClass: 'error',
                duration: undefined,
              }
            );
            return snackbar.onAction().pipe(
              tap(() => {
                window.open(
                  'https://community.activepieces.com/c/bugs',
                  '_blank',
                  'noreferer noopener'
                );
                this.updatingBot = false;
              }),
              map(() => void 0)
            );
          }),
          switchMap(() => {
            return this.flagsService.getFrontendUrl();
          }),
          tap((url) => {
            navigator.clipboard.writeText(`${url}/chatbots/${chatbot.id}`);
            this.snackBar.open(`${chatbot.displayName} url copied.`);
            this.updatingBot = false;
            menuTrigger.closeMenu();
            this.refreshTable$.next(true);
          }),
          map(() => void 0)
        );
    }
  }

  shareChatbotLinkTooltipText(chatbot: Chatbot) {
    return chatbot.connectionId
      ? $localize`Share bot chat link`
      : $localize`OpenAi connection is missing`;
  }

  chatWithBotTooltipText(chatbot: Chatbot) {
    return chatbot.connectionId
      ? $localize`Chat with bot`
      : $localize`OpenAi connection is missing`;
  }
}
