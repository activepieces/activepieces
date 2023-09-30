import { ResolveFn, Router } from '@angular/router';
import { ChatBotService } from './chatbot.service';
import { inject } from '@angular/core';
import { ChatbotMetadata } from '@activepieces/shared';
import { catchError } from 'rxjs';

import { HttpErrorResponse } from '@angular/common/http';

export const chatbotMetadataResolver: ResolveFn<ChatbotMetadata> = (route) => {
  const id = route.params['id'];

  const router = inject(Router);
  return inject(ChatBotService)
    .metadata(id)
    .pipe(
      catchError((err: HttpErrorResponse) => {
        router.navigate(['/']);
        throw err;
      })
    );
};
