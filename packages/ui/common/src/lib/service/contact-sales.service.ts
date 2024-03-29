import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  map,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FlagService } from './flag.service';
import { AuthenticationService } from './authentication.service';
import { ApFlagId } from '@activepieces/shared';

export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'API'
  | 'SSO'
  | 'AUDIT_LOGS'
  | 'GIT_SYNC';

interface Feature {
  label: string;
  checked: boolean;
  key: FeatureKey;
}

interface ContactData {
  email: string;
  name: string;
  features: Feature[];
  message: string;
  flags?: { [key: string]: unknown };
}

@Injectable({
  providedIn: 'root',
})
export class ContactSalesService {
  private _contactSalesState = new BehaviorSubject<boolean>(false);

  private _contactData = new BehaviorSubject<ContactData>({
    email: '',
    name: '',
    features: [
      {
        label: 'Create Multiple Projects',
        checked: false,
        key: 'PROJECTS',
      },
      { label: 'Brand Activepieces', checked: false, key: 'BRANDING' },
      { label: 'Control Pieces', checked: false, key: 'PIECES' },
      {
        label: 'Create Custom Templates',
        checked: false,
        key: 'TEMPLATES',
      },
      { label: 'Access Full API', checked: false, key: 'API' },
      { label: 'Single Sign On', checked: false, key: 'SSO' },
      { label: 'Audit Logs', checked: false, key: 'AUDIT_LOGS' },
      {
        label: 'Team Collaboration via Git',
        checked: false,
        key: 'GIT_SYNC',
      },
    ],
    message: '',
    flags: {},
  });

  public contactSalesState$ = this._contactSalesState.asObservable();
  public contactData$ = this._contactData.asObservable();

  public selectedFeaturesCount$: Observable<number> = this._contactData.pipe(
    map((data) => data.features.filter((feature) => feature.checked).length),
    startWith(0)
  );

  constructor(
    private http: HttpClient,
    private flagService: FlagService,
    private authenticationService: AuthenticationService
  ) {
    this.updateUserData();
  }

  public open(featureKeysToCheck: FeatureKey[] = []): void {
    this._contactSalesState.next(true);
    this.resetContactData();

    featureKeysToCheck.forEach((key) => {
      this.updateFeatureCheckedByKey(key, true);
    });
  }

  public close(): void {
    this._contactSalesState.next(false);
  }

  sendRequest() {
    return this.flagService.getAllFlags().pipe(
      take(1),
      switchMap((flags) => {
        const requestData = { ...this._contactData.value };

        // IMPORTANT: remove the !
        if (!flags[ApFlagId.TELEMETRY_ENABLED]) {
          requestData.flags = flags;
        }

        return this.http.post<{ status: string; message?: string }>(
          'https://sales.activepieces.com/submit-inapp-contact-form',
          requestData
        );
      })
    );
  }

  updateContactData(data: ContactData) {
    this._contactData.next(data);
  }

  updateFeatureChecked(index: number, isChecked: boolean): void {
    const currentData = { ...this._contactData.value };
    if (currentData.features && currentData.features[index]) {
      currentData.features[index].checked = isChecked;
      this._contactData.next(currentData);
    }
  }

  public updateFeatureCheckedByKey(key: FeatureKey, isChecked: boolean): void {
    const featureIndex = this._contactData.value.features.findIndex(
      (feature) => feature.key === key
    );
    if (featureIndex !== -1) {
      this.updateFeatureChecked(featureIndex, isChecked);
    }
  }

  private updateUserData(): void {
    const name = `${this.authenticationService.currentUser.firstName} ${this.authenticationService.currentUser.lastName}`;
    const email = this.authenticationService.currentUser.email;
    this.updateContactData({
      ...this._contactData.value,
      email,
      name,
    });
  }

  private resetContactData(): void {
    const resetFeatures = this._contactData.value.features.map((feature) => ({
      ...feature,
      checked: false,
    }));
    this._contactData.next({
      ...this._contactData.value,
      features: resetFeatures,
    });
    this.updateUserData();
  }
}
