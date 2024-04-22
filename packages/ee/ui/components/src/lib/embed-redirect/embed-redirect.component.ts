import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import {
  ActivepiecesClientEventName,
  ActivepiecesClientInit,
  ActivepiecesVendorEventName,
  ActivepiecesVendorInit,
  _AP_JWT_TOKEN_QUERY_PARAM_NAME,
} from 'ee-embed-sdk';
import {
  AuthenticationService,
  NavigationService,
} from '@activepieces/ui/common';
import { ManagedAuthService } from './managed-auth.service';
import { EmbeddingService } from '@activepieces/ui/common';

@Component({
  selector: 'ap-embed-redirect',
  templateUrl: './embed-redirect.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedRedirectComponent implements OnDestroy, OnInit {
  validateJWT$?: Observable<void>;
  showError = false;
  constructor(
    private route: ActivatedRoute,
    private managedAuthService: ManagedAuthService,
    private embedService: EmbeddingService,
    private navigationService: NavigationService,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const jwt = this.route.snapshot.queryParamMap.get(
      _AP_JWT_TOKEN_QUERY_PARAM_NAME
    );
    if (jwt === null) {
      throw new Error('Activepieces: no provided jwt token');
    }

    this.validateJWT$ = this.managedAuthService
      .generateApToken({ externalAccessToken: jwt })
      .pipe(
        tap((res) => {
          this.authenticationService.saveToken(res.token);
          this.authenticationService.updateUser({ ...res });
          const event: ActivepiecesClientInit = {
            type: ActivepiecesClientEventName.CLIENT_INIT,
            data: {},
          };

          window.parent.postMessage(event, '*');
          window.addEventListener('message', this.initializedVendorHandler);
        }),
        map(() => void 0)
      );
  }

  initializedVendorHandler = (event: MessageEvent<ActivepiecesVendorInit>) => {
    if (
      event.source === window.parent &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_INIT
    ) {
      this.embedService.setState({
        hideSideNav: event.data.data.hideSidebar,
        isEmbedded: true,
        hideLogoInBuilder: event.data.data.hideLogoInBuilder || false,
        hideFlowNameInBuilder: event.data.data.hideFlowNameInBuilder || false,
        prefix: event.data.data.prefix,
        disableNavigationInBuilder: event.data.data.disableNavigationInBuilder,
        hideFolders: event.data.data.hideFolders || false,
        sdkVersion: event.data.data.sdkVersion,
      });
      this.navigationService.navigate({
        route: ['/'],
      });
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('message', this.initializedVendorHandler);
  }
}
