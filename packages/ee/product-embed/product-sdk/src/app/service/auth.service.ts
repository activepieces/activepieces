import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppOAuth2Settings } from '@activepieces/ee-shared';
import { getRedrectUrl } from '../helper/helper';
import { apId } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentlyOpenedAuthPopup: Window | null | undefined;

  openPopUp(request: AppOAuth2Settings) {
    const winTarget = '_blank';
    const winFeatures =
      'resizable=no, toolbar=no,left=100, top=100, scrollbars=no, menubar=no, status=no, directories=no, location=no, width=600, height=800';
    const redirect_uri = getRedrectUrl();
    const url =
      request.authUrl +
      '?response_type=code' +
      '&client_id=' +
      request.clientId +
      '&redirect_uri=' +
      redirect_uri +
      '&access_type=offline' +
      '&state=' +
      apId() +
      '&prompt=consent' +
      '&scope=' +
      request.scope;

    const popup = window.open(url, winTarget, winFeatures);
    this.currentlyOpenedAuthPopup = popup;
    return new Observable<unknown>((observer) => {
      window.addEventListener('message', function (event) {
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
        }
      });
      setInterval(() => {
        if (popup?.closed) {
          observer.error('Window Closed');
          observer.complete();
        }
      }, 500);
    });
  }

  closeCurrentlyOpenedPopup() {
    this.currentlyOpenedAuthPopup?.close();
  }
}
