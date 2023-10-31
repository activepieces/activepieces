import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { environment } from '@activepieces/ui/common';
import { ManagedAuthnRequestBody } from '@activepieces/ee-shared';
import { HttpClient } from '@angular/common/http';
import { AuthenticationResponse } from '@activepieces/shared';

export type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  prefix: string;
};
@Injectable({
  providedIn: 'root',
})
export class EmbeddingService {
  embeddingStateSubject: BehaviorSubject<EmbeddingState>;
  constructor(private http: HttpClient) {
    this.embeddingStateSubject = new BehaviorSubject<EmbeddingState>({
      isEmbedded: false,
      hideSideNav: false,
      prefix: '',
    });
  }
  getState() {
    return this.embeddingStateSubject.value;
  }
  setState(newState: EmbeddingState) {
    return this.embeddingStateSubject.next(newState);
  }
  getState$() {
    return this.embeddingStateSubject.asObservable();
  }
  getIsInEmbedding$() {
    return this.getState$().pipe(map((res) => res.isEmbedded));
  }

  activepiecesRouteChanged(route: string) {
    window.parent.postMessage(
      {
        type: 'CLIENT_ROUTE_CHANGED',
        data: {
          route: route,
        },
      },
      '*'
    );
  }

  generateApToken(request: ManagedAuthnRequestBody) {
    return this.http.post<AuthenticationResponse>(
      environment.apiUrl + `/managed-authn/external-token`,
      request
    );
  }
}
