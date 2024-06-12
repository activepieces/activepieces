import {
  GenerateRequestBodyRequest,
  GenerateRequestBodyResponse,
  WebsocketClientEvent,
  WebsocketServerEvent,
} from '@activepieces/shared';
import { WebSocketService } from '@activepieces/ui/common';
import { Injectable } from '@angular/core';
import { Observable, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RequestWriterService {
  constructor(private websocketService: WebSocketService) {}

  prompt(
    request: GenerateRequestBodyRequest
  ): Observable<GenerateRequestBodyResponse> {
    this.websocketService.socket.emit(
      WebsocketServerEvent.GENERATE_CODE,
      request
    );
    return this.websocketService.socket
      .fromEvent<GenerateRequestBodyResponse>(
        WebsocketClientEvent.GENERATE_CODE_FINISHED
      )
      .pipe(take(1));
  }
}
