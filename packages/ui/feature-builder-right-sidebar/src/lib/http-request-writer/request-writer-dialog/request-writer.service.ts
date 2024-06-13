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

  fetchApiDetails(
    request: GenerateRequestBodyRequest
  ): Observable<GenerateRequestBodyResponse> {
    this.websocketService.socket.emit(
      WebsocketServerEvent.REQUEST_WRITE,
      request
    );
    return this.websocketService.socket
      .fromEvent<GenerateRequestBodyResponse>(
        WebsocketClientEvent.REQUEST_WRITE_FINISHED
      )
      .pipe(take(1));
  }
}
