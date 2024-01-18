import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Platform } from '@activepieces/ee-shared';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { FederatedAuthnProviderEnum } from './federated-authn-provider.enum';

@Component({
  selector: 'app-sso-settings',
  templateUrl: './sso-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class SsoSettingsComponent implements OnInit {
  platform$!: BehaviorSubject<Platform>;
  addDomain$?: Observable<string>;
  removeDomain$?: Observable<void>;
  @Input({ required: true }) platform!: Platform;
  FederatedAuthnProviderEnum = FederatedAuthnProviderEnum;

  ngOnInit(): void {
    this.platform$ = new BehaviorSubject(this.platform);
  }

  platformUpdated(platform: Platform) {
    this.platform$.next(platform);
  }
}
