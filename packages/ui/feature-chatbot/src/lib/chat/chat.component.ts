import { Component, OnInit } from '@angular/core';
import { ChatBotService } from '../chatbot.service';
import { Observable, delay, map, tap } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

@Component({
  selector: 'activepieces-chat',
  templateUrl: './chat.component.html',
  styleUrls: []
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  messageControl: FormControl<string | null>;

  sendMessage$: Observable<void> | undefined;
  sending = false;
  chatbotId: string | undefined;

  constructor(
    private chatbotService: ChatBotService,
    private router: ActivatedRoute
  ) {
    this.messageControl = new FormControl('', Validators.required);
  }

  ngOnInit(): void {
    this.chatbotId = this.router.snapshot.params['id'];
  }

  send() {
    if (this.sending || this.messageControl.invalid) {
      return;
    }
    const input = this.messageControl.value!;
    this.messages.push({
      text: input,
      sender: 'user'
    });
    this.messageControl.reset();
    this.sending = true;
    this.sendMessage$ = this.chatbotService
      .ask({
        chatbotId: this.chatbotId!,
        input
      })
      .pipe(
        // TODO REMOVE
        delay(3000), // delay for 3000ms
        tap((res) => {
          this.sending = false;
          this.messages.push({
            text: res.output,
            sender: 'bot'
          });
        }),
        map(() => void 0)
      );
    this.messageControl.reset();
  }
}
