import { GoogleFilePickerPropertyValueSchema } from '@activepieces/pieces-framework';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable, of, switchMap } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class GoogleFilePickerService {
  private isPickerApiLoaded$ = new BehaviorSubject<boolean>(false);

  loadGapiScript() {
    if (!this.isPickerApiLoaded$.value) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        this.loadGooglePicker();
      };
      document.body.appendChild(script);
    }
  }

  loadGooglePicker() {
    gapi.load('picker', () => {
      this.isPickerApiLoaded$.next(true);
    });
  }

  getIsPickerLoaded$() {
    return this.isPickerApiLoaded$.asObservable();
  }

  showPicker(connectionId: string) {
    return of(connectionId).pipe(
      switchMap((accessToken) => {
        return new Observable<GoogleFilePickerPropertyValueSchema | null>(
          (observer) => {
            const userDriveView = new google.picker.DocsView(
              google.picker.ViewId.DOCS
            );
            userDriveView.setIncludeFolders(true);
            const sharedDriveView = new google.picker.DocsView(
              google.picker.ViewId.DOCS
            );
            sharedDriveView.setEnableDrives(true).setIncludeFolders(true);
            const picker = new google.picker.PickerBuilder()
              .addView(userDriveView)
              .addView(sharedDriveView)
              .setOAuthToken(accessToken)
              .setCallback((data) => {
                const formattedData = this.pickerCallback(data);
                observer.next(formattedData);
                observer.complete();
              })
              .build();
            picker.setVisible(true);
          }
        );
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pickerCallback(data: any) {
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      const doc = data[google.picker.Response.DOCUMENTS][0];
      const fileDisplayName = doc[google.picker.Document.NAME];
      const fileId = doc[google.picker.Document.ID];
      return {
        fileId,
        fileDisplayName,
      };
    }
    return null;
  }
}
