import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { UUID } from 'angular2-uuid';
import { map, Observable } from 'rxjs';
import {
  OAuth2PopupParams,
  OAuth2PopupResponse,
} from '../model/oauth2-popup-params.interface';
import { nanoid } from 'nanoid';

@Injectable({
  providedIn: 'root',
})
export class Oauth2Service {
  private currentlyOpenPopUp: Window | null = null;

  public openPopup(
    request: OAuth2PopupParams
  ): Observable<OAuth2PopupResponse> {
    this.currentlyOpenPopUp?.close();
    const winTarget = '_blank';
    const winFeatures =
      'resizable=no, toolbar=no,left=100, top=100, scrollbars=no, menubar=no, status=no, directories=no, location=no, width=600, height=800';
    const redirect_uri = request.redirect_url || environment.redirectUrl;
    let url =
      request.auth_url +
      '?response_type=code' +
      '&client_id=' +
      request.client_id +
      '&redirect_uri=' +
      redirect_uri +
      '&access_type=offline' +
      '&state=' +
      UUID.UUID() +
      '&prompt=consent' +
      '&scope=' +
      request.scope;
    if (request.extraParams) {
      const entries = Object.entries(request.extraParams);
      for (let i = 0; i < entries.length; ++i) {
        url = url + '&' + entries[i][0] + '=' + entries[i][1];
      }
    }
    let code_challenge: string | undefined = undefined;
    if (request.pkce) {
      code_challenge = nanoid();
      url =
        url + '&code_challenge_method=plain&code_challenge=' + code_challenge;
    }
    const popup = window.open(url, winTarget, winFeatures);
    this.currentlyOpenPopUp = popup;
    const codeObs$ = new Observable<any>((observer) => {
      window.addEventListener('message', function handler(event) {
        if (redirect_uri.startsWith(event.origin)) {
          if (event.data != undefined) {
            event.data.code = decodeURIComponent(event.data.code);
            observer.next(event.data);
            popup?.close();
            observer.complete();
          } else {
            observer.error('No code returned');
            popup?.close();
            observer.complete();
          }
          window.removeEventListener('message', handler);
        }
      });
    });

    return codeObs$.pipe(
      map((params) => {
        if (params != undefined && params.code != undefined) {
          return {
            code: params.code,
            code_challenge: code_challenge,
          };
        }

        throw new Error(
          `params for openPopUp is empty or the code is, params:${params}`
        );
      })
    );
  }
}
