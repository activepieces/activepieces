import {
  GenerateCodeRequest,
  WebsocketClientEvent,
  WebsocketServerEvent,
  GenerateCodeResponse,
} from '@activepieces/shared';
import { WebSocketService } from '@activepieces/ui/common';
import { Injectable } from '@angular/core';
import { Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CodeWriterService {
  constructor(private websocketService: WebSocketService) {}

  prompt(request: GenerateCodeRequest): Observable<GenerateCodeResponse> {
    this.websocketService.socket.emit(
      WebsocketServerEvent.GENERATE_CODE,
      request
    );
    return this.websocketService.socket
      .fromEvent<GenerateCodeResponse>(
        WebsocketClientEvent.GENERATE_CODE_FINISHED
      )
      .pipe(take(1));
  }
}
