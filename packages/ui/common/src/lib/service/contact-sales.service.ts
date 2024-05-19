import { Injectable } from '@angular/core';
import { BehaviorSubject, switchMap, take } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FlagService } from './flag.service';
import { TelemetryService } from './telemetry.service';
import { TelemetryEventName } from '@activepieces/shared';
import { FeatureKey } from '../utils/consts';

export interface Feature {
  label: string;
  key: FeatureKey;
}

export const FEATURES: Feature[] = [
  {
    label: 'Create Multiple Projects',
    key: 'PROJECTS',
  },
  { label: 'Brand Activepieces', key: 'BRANDING' },
  { label: 'Control Pieces', key: 'PIECES' },
  {
    label: 'Create Custom Templates',
    key: 'TEMPLATES',
  },
  { label: 'Access Full API', key: 'API' },
  { label: 'Single Sign On', key: 'SSO' },
  { label: 'Audit Logs', key: 'AUDIT_LOGS' },
  {
    label: 'Team Collaboration via Git',
    key: 'GIT_SYNC',
  },
  {
    label: 'Track Consecutive Failed Runs',
    key: 'ISSUES',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ContactSalesService {
  public contactSalesState = new BehaviorSubject<boolean>(false);

  public selectedFeature = new BehaviorSubject<FeatureKey[]>([]);

  constructor(
    private http: HttpClient,
    private telemetryService: TelemetryService,
    private flagService: FlagService
  ) {}

  public open(features: FeatureKey[]): void {
    this.telemetryService.capture({
      name: TelemetryEventName.REQUEST_TRIAL_CLICKED,
      payload: {
        feature: features.length > 0 ? features[0].toString() : null,
      },
    });
    this.selectedFeature.next(features);
    this.contactSalesState.next(true);
  }

  public close(): void {
    this.contactSalesState.next(false);
  }

  sendRequest({
    name,
    email,
    domain,
    message,
    features,
  }: {
    name: string;
    email: string;
    domain: string;
    message: string;
    features: FeatureKey[];
  }) {
    this.telemetryService.capture({
      name: TelemetryEventName.REQUEST_TRIAL_SUBMITTED,
      payload: {},
    });
    return this.flagService.getAllFlags().pipe(
      take(1),
      switchMap((flags) => {
        return this.http.post<{ status: string; message?: string }>(
          'https://sales.activepieces.com/submit-inapp-contact-form',
          {
            name,
            email,
            domain,
            message,
            features: FEATURES.map((feature) => {
              return {
                key: feature.key,
                label: feature.label,
                checked: features.includes(feature.key),
              };
            }),
            flags,
          }
        );
      })
    );
  }
}
