import { Component } from '@angular/core';
import { ChatBotService } from '../chatbot.service';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Chatbot, User } from '@activepieces/shared';
import { AuthenticationService } from '@activepieces/ui/common';

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: [],
})
export class ChatComponent {
  messages: Message[] = [];
  messageControl: FormControl<string | null>;
  sendMessage$: Observable<void> | undefined;
  sendingMessage$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  chatbotId: string | undefined;
  chatbotDisplayName = '';
  data$: Observable<void>;
  readonly user: User;
  constructor(
    private chatbotService: ChatBotService,
    private actRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService
  ) {
    this.messageControl = new FormControl('');
    this.chatbotId = this.actRoute.snapshot.params['id'];
    this.data$ = this.actRoute.data.pipe(
      tap((value) => {
        const routeData: { chatbot: Chatbot } = value as { chatbot: Chatbot };
        this.chatbotDisplayName = routeData.chatbot.displayName;
      }),
      map(() => void 0)
    );
    this.user = this.authService.currentUser;
  }

  send() {
    if (this.sendingMessage$.value || !this.messageControl.value) {
      return;
    }
    const input = this.messageControl.value!;
    this.messages.push({
      text: input,
      sender: 'user',
    });
    this.messageControl.reset();
    this.sendingMessage$.next(true);
    this.sendMessage$ = this.chatbotService
      .ask({
        chatbotId: this.chatbotId!,
        input,
      })
      .pipe(
        tap((res) => {
          this.sendingMessage$.next(false);
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
