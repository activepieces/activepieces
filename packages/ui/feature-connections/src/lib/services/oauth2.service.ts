import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { nanoid } from 'nanoid';
import {
  OAuth2PopupParams,
  OAuth2PopupResponse,
} from '../models/oauth2-popup-params.interface';
import { environment } from '@activepieces/ui/common';

@Injectable({
  providedIn: 'root',
})
export class Oauth2Service {
  private currentlyOpenPopUp: Window | null = null;

  public openPopup(
    request: OAuth2PopupParams
  ): Observable<OAuth2PopupResponse> {
    this.closeOpenPopup();

    const pckeChallenge = nanoid();
    const url = this.constructUrl(request, pckeChallenge);
    const popup = this.openWindow(url);
    this.currentlyOpenPopUp = popup;

    return this.getCodeObservable(
      request.redirect_url || environment.redirectUrl,
      request.pkce,
      pckeChallenge,
      popup
    );
  }

  public openPopupWithLoginUrl(
    url: string,
    redirectUrl: string
  ): Observable<OAuth2PopupResponse> {
    const popup = this.openWindow(url);
    this.currentlyOpenPopUp = popup;

    return this.getCodeObservable(redirectUrl, undefined, undefined, popup);
  }

  private closeOpenPopup(): void {
    this.currentlyOpenPopUp?.close();
  }

  private constructUrl(
    request: OAuth2PopupParams,
    pckeChallenge: string
  ): string {
    const queryParams: Record<string, string> = {
      response_type: 'code',
      client_id: request.client_id,
      redirect_uri: request.redirect_url || environment.redirectUrl,
      access_type: 'offline',
      state: nanoid(),
      prompt: 'consent',
      scope: request.scope,
      ...(request.extraParams || {}),
    };

    if (request.pkce) {
      const code_challenge = pckeChallenge;
      queryParams['code_challenge_method'] = 'plain';
      queryParams['code_challenge'] = code_challenge;
    }

    const url = new URL(request.auth_url);

    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  private openWindow(url: string): Window | null {
    const winFeatures =
      'resizable=no, toolbar=no,left=100, top=100, scrollbars=no, menubar=no, status=no, directories=no, location=no, width=600, height=800';
    return window.open(url, '_blank', winFeatures);
  }

  private getCodeObservable(
    redirectUrl: string,
    pkce: boolean | undefined,
    pckeChallenge: string | undefined,
    popup: Window | null
  ): Observable<OAuth2PopupResponse> {
    return new Observable<OAuth2PopupResponse>((observer) => {
      window.addEventListener('message', function handler(event) {
        if (
          redirectUrl &&
          redirectUrl.startsWith(event.origin) &&
          event.data['code']
        ) {
          event.data.code = decodeURIComponent(event.data.code);
          observer.next(event.data);
          popup?.close();
          observer.complete();
          window.removeEventListener('message', handler);
        }
      });
    }).pipe(
      map((params) => {
        if (params != undefined && params.code != undefined) {
          return {
            code: params.code,
            code_challenge: pkce ? pckeChallenge : undefined,
          };
        }

        throw new Error(
          `Params for openPopUp is empty or the code is, params:${params}`
        );
      })
    );
  }
}
