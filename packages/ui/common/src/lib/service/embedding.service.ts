import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import semVer from 'semver';
export type EmbeddingState = {
  isEmbedded: boolean;
  hideSideNav: boolean;
  prefix: string;
  hideLogoInBuilder: boolean;
  disableNavigationInBuilder: boolean;
  hideFolders: boolean;
  hideFlowNameInBuilder: boolean;
  sdkVersion?: string;
  predefinedConnectionName?: string;
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
      hideLogoInBuilder: false,
      prefix: '',
      disableNavigationInBuilder: false,
      hideFolders: false,
      hideFlowNameInBuilder: false,
    });
  }
  getState() {
    return this.embeddingStateSubject.value;
  }
  getIsInEmbedding() {
    return this.embeddingStateSubject.value.isEmbedded;
  }
  setState(newState: EmbeddingState) {
    return this.embeddingStateSubject.next(newState);
  }
  getState$() {
    return this.embeddingStateSubject.asObservable();
  }

  private determineSkipLocationChange(state: EmbeddingState) {
    if (!state.sdkVersion) {
      return state.isEmbedded;
    }
    if (semVer.gte(state.sdkVersion, '0.3.0')) {
      return false;
    }
    throw new Error('SDK version is not supported');
  }

  getSkipLocationChange$() {
    return this.getState$().pipe(
      map((res) => this.determineSkipLocationChange(res))
    );
  }

  getSkipLocationChange() {
    const state = this.getState();
    return this.determineSkipLocationChange(state);
  }

  getIsInEmbedding$() {
    return this.getState$().pipe(map((res) => res.isEmbedded));
  }
  getShowNavigationInBuilder$() {
    return this.getState$().pipe(map((res) => !res.disableNavigationInBuilder));
  }

  getHideLogoInBuilder$() {
    return this.getState$().pipe(map((res) => res.hideLogoInBuilder));
  }

  getHideFLowNameInBuilder$() {
    return this.getState$().pipe(map((res) => res.hideFlowNameInBuilder));
  }

  getHideFolders$() {
    return this.getState$().pipe(map((res) => res.hideFolders));
  }
  setPredefinedConnectionName(connectionName: string | undefined) {
    this.setState({
      ...this.getState(),
      predefinedConnectionName: connectionName,
    });
  }
  getPredefinedConnectionName() {
    return this.getState().predefinedConnectionName;
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
