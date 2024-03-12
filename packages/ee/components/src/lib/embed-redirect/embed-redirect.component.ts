import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import {
  ActivepiecesClientEventName,
  ActivepiecesVendorEventName,
  ActivepiecesVendorInit,
  jwtTokenQueryParamName,
} from '@activepieces/ee-embed-sdk';
import { AuthenticationService } from '@activepieces/ui/common';
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
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit(): void {
    const jwt = this.route.snapshot.queryParamMap.get(jwtTokenQueryParamName);
    if (jwt === null) {
      throw new Error('Activepieces: no provided jwt token');
    }

    this.validateJWT$ = this.managedAuthService
      .generateApToken({ externalAccessToken: jwt })
      .pipe(
        tap((res) => {
          this.authenticationService.saveToken(res.token);
          this.authenticationService.updateUser({ ...res });
          window.parent.postMessage(
            {
              type: ActivepiecesClientEventName.CLIENT_INIT,
            },
            '*'
          );

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
        prefix: event.data.data.prefix,
        disableNavigationInBuilder: event.data.data.disableNavigationInBuilder,
        hideFolders: event.data.data.hideFolders || false,
      });
      this.router.navigate([event.data.data.initialRoute], {
        skipLocationChange: true,
      });
    }
  };

  ngOnDestroy(): void {
    window.removeEventListener('message', this.initializedVendorHandler);
  }
}
