import { Component, OnInit } from '@angular/core';
import { ChatBotService } from '../chatbot.service';
import { Observable, delay, map, tap } from 'rxjs';
import { FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: [],
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];
  messageControl: FormControl<string | null>;
  sendMessage$: Observable<void> | undefined;
  sending = false;
  chatbotId: string | undefined;

  constructor(
    private chatbotService: ChatBotService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.messageControl = new FormControl('', Validators.required);
  }

  ngOnInit(): void {
    this.chatbotId = this.route.snapshot.params['id'];
  }

  send() {
    if (this.sending || this.messageControl.invalid) {
      return;
    }
    const input = this.messageControl.value!;
    this.messages.push({
      text: input,
      sender: 'user',
    });
    this.messageControl.reset();
    this.sending = true;
    this.sendMessage$ = this.chatbotService
      .ask({
        chatbotId: this.chatbotId!,
        input,
      })
      .pipe(
        // TODO REMOVE
        delay(3000), // delay for 3000ms
        tap((res) => {
          this.sending = false;
          this.messages.push({
            text: res.output,
            sender: 'bot',
          });
        }),
        map(() => void 0)
      );
    this.messageControl.reset();
  }
  redirectHome(newWindow: boolean) {
    if (newWindow) {
      const url = this.router.serializeUrl(this.router.createUrlTree([``]));
      window.open(url, '_blank', 'noopener');
    } else {
      const urlArrays = this.router.url.split('/');
      urlArrays.splice(urlArrays.length - 1, 1);
      const fixedUrl = urlArrays.join('/');
      this.router.navigate([fixedUrl]);
    }
  }
}
