import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ChatBotService } from '../chatbot.service';
import { Observable, map, tap } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'activepieces-chatbot-type',
  templateUrl: './chatbot-type.component.html',
  styleUrls: []
})
export class ChatbotTypeComponent {
  loading = false;
  bots = [
    {
      displayName: 'Chatbot 1',
      id: 'customer-service-bot'
    },
    {
      displayName: 'Chatbot 2',
      id: 'customer-service-bot'
    }
  ];

  createBot$: Observable<void> | undefined;

  constructor(
    private router: Router,
    private dialogRef: MatDialogRef<Record<string, never>>,
    private chatbotService: ChatBotService
  ) {}
  ngOnInit(): void {}

  createBot(type: string) {
    this.loading = true;
    this.createBot$ = this.chatbotService
      .create({
        type: type
      })
      .pipe(
        tap((value) => {
          this.router.navigate(['/chatbots', value.id, 'settings']);
          this.loading = false;
          this.hide();
        }),
        map(() => {})
      );
  }
  hide() {
    this.dialogRef.close();
  }
}
