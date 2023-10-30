import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  prefix:string
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
      prefix:''
    });
  }
  getState() {
    return this.embeddingStateSubject.value;
  }
  setState(newState: EmbeddingState) {

    return this.embeddingStateSubject.next(newState);
  }
  getState$()
  {
    return this.embeddingStateSubject.asObservable();
  }
}
