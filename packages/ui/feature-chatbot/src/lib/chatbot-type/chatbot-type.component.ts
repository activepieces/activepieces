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
      prompt: 'Custom Bot',
      id: 'custom-bot'
    },
    {
      displayName: 'Customer Service Bot',
      id: 'custom-bot'
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
