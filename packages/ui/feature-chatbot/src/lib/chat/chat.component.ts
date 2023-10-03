import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ChatBotService } from '../chatbot.service';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  catchError,
  interval,
  map,
  tap,
} from 'rxjs';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Chatbot } from '@activepieces/shared';
import { AuthenticationService } from '@activepieces/ui/common';
import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
type Message = {
  text: string;
  sender: 'user' | 'bot';
};

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  @ViewChild('chatThread') chatThreadHTML:
    | ElementRef<HTMLDivElement>
    | undefined;
  messages: Message[] = [];
  messageControl: FormControl<string | null>;
  sendMessage$: Observable<void> | undefined;
  sendingMessage$: BehaviorSubject<boolean> = new BehaviorSubject(false);
  chatbotId: string | undefined;
  chatbotDisplayName = '';
  dots$: Observable<string>;
  data$: Observable<void>;
  readonly isLoggedIn: boolean;
  constructor(
    private chatbotService: ChatBotService,
    private actRoute: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private snackbar:MatSnackBar
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
    this.isLoggedIn = this.authService.isLoggedIn();
    this.dots$ = interval(350).pipe(
      map((res) => {
        const idx = res % 3;
        if (idx == 0) return '.';
        if (idx === 1) return '..';
        else return '...';
      })
    );
  }

  send() {
    if (this.sendingMessage$.value || !this.messageControl.value?.trim()) {
      return;
    }
    const input = this.messageControl.value!;
    this.messages.push({
      text: input,
      sender: 'user',
    });
    this.messageControl.reset();
    this.scrollThreadDown();
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
        tap(() => {
          this.scrollThreadDown();
        }),
        catchError((err: HttpErrorResponse) => {
          if (
            err.status === HttpStatusCode.Unauthorized &&
            err.error['code'] === 'invalid_api_key'
          ) {
            this.messages.push({
              text: 'Oops! make sure your OpenAI api key is valid, it seems it is not.',
              sender: 'bot',
            });
          } else if (err.status === HttpStatusCode.PaymentRequired) {
            this.messages.push({
              text: 'Oops! Your OpenAI quota is exceeded, please check your OpenAI plan and billing details.',
              sender: 'bot',
            });
          } else {
            this.messages.push({
              text: 'Oops! an unexpected error occured, please contact support.',
              sender: 'bot',
            });
          }
          this.sendingMessage$.next(false);
          console.log(this.chatThreadHTML);
          this.scrollThreadDown();
          return EMPTY;
        }),
        map(() => void 0)
      );
    this.messageControl.reset();
  }
  private scrollThreadDown() {
    setTimeout(() => {
      console.log(this.chatThreadHTML);
      this.chatThreadHTML?.nativeElement.scrollTo({
        left: 0,
        top: this.chatThreadHTML.nativeElement?.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
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

  codeCopied()
  {
    this.snackbar.open('Copied to clipboard');
  }
}
