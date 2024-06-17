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
    label: $localize`Multiple Projects`,
    key: `PROJECTS`,
  },
  { label: 'Brand Activepieces', key: 'BRANDING' },
  { label: 'Control Pieces', key: 'PIECES' },
  { label: 'Enterprise Pieces', key: 'ENTERPRISE_PIECES' },
  {
    label: $localize`Custom Templates`,
    key: `TEMPLATES`,
  },
  { label: $localize`Access Full API`, key: `API` },
  { label: $localize`Single Sign On`, key: `SSO` },
  { label: $localize`Audit Logs`, key: `AUDIT_LOGS` },
  {
    label: $localize`Team Collaboration via Git`,
    key: `GIT_SYNC`,
  },
  {
    label: $localize`Alerts on Failed Runs`,
    key: `ISSUES`,
  },
  {
    label: $localize`Enterprise Pieces`,
    key: `ENTERPRISE_PIECES`,
  },
];

export const featuresNames = FEATURES.map((feature) => feature.label);
@Injectable({
  providedIn: `root`,
})
export class ContactSalesService {
  public contactSalesState = new BehaviorSubject<boolean>(false);
  constructor(
    private http: HttpClient,
    private telemetryService: TelemetryService,
    private flagService: FlagService
  ) {}

  public open(location: string): void {
    this.telemetryService.capture({
      name: TelemetryEventName.REQUEST_TRIAL_CLICKED,
      payload: {
        location,
      },
    });
    this.contactSalesState.next(true);
  }

  public close(): void {
    this.contactSalesState.next(false);
  }

  sendRequest(req: {
    name: string;
    email: string;
    numberOfEmployees: string;
    companyName: string;
    goal: string;
  }) {
    this.telemetryService.capture({
      name: TelemetryEventName.REQUEST_TRIAL_SUBMITTED,
      payload: req,
    });
    return this.flagService.getAllFlags().pipe(
      take(1),
      switchMap((flags) => {
        return this.http.post<{ status: string; message?: string }>(
          'https://sales.activepieces.com/submit-inapp-contact-form',
          {
            name: req.name,
            email: req.email,
            numberOfEmployees: req.numberOfEmployees,
            companyName: req.companyName,
            goal: req.goal,
            features: [],
            flags,
          }
        );
      })
    );
  }
}
