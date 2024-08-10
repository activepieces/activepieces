import {
  GenerateHttpRequestBodyRequest,
  GenerateHttpRequestBodyResponse,
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
    request: GenerateHttpRequestBodyRequest
  ): Observable<GenerateHttpRequestBodyResponse> {
    this.websocketService.socket.emit(
      WebsocketServerEvent.GENERATE_HTTP_REQUEST,
      request
    );
    return this.websocketService.socket
      .fromEvent<GenerateHttpRequestBodyResponse>(
        WebsocketClientEvent.GENERATE_HTTP_REQUEST_FINISHED
      )
      .pipe(take(1));
  }
}
