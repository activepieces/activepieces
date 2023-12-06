import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  prefix: string;
  showBackButtonAndFolderName: boolean;
};
@Injectable({
  providedIn: 'root',
})
export class EmbeddingService {
  embeddingStateSubject: BehaviorSubject<EmbeddingState>;
  constructor() {
    this.embeddingStateSubject = new BehaviorSubject<EmbeddingState>({
      isEmbedded: false,
      hideSideNav: false,
      prefix: '',
      showBackButtonAndFolderName: true,
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
  getShowFolderNameAndBackButton$() {
    return this.getState$().pipe(map((res) => res.showBackButtonAndFolderName));
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
}
