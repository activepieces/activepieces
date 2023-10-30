import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

import { EmbeddingService } from '../embedding.service';
import { Observable, map, tap } from 'rxjs';

@Component({
  selector: 'ap-iframe-listener',
  templateUrl: './iframe-listener.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IframeListenerComponent {
  embeddingListener$: Observable<void>;

  constructor(
    private router: Router,
    private embeddingService: EmbeddingService
  ) {
    this.embeddingListener$ = this.embeddingService.getState$().pipe(
      tap((val) => {
        if (val.isEmbedded) {
          window.addEventListener('message', this.listenToVendorRouteChanges);
        }
      }),
      map(() => void 0)
    );
  }

  listenToVendorRouteChanges = (
    event: MessageEvent<{
      type: 'VENDOR_ROUTE_CHANGED';
      data: {
        vendorRoute: string;
      };
    }>
  ) => {
    if (
      event.source === window.parent &&
      event.data.type === 'VENDOR_ROUTE_CHANGED'
    ) {
      const targetRoute = event.data.data.vendorRoute;
      const routeToNavigateTo = targetRoute.endsWith('/')
        ? targetRoute
        : `/${targetRoute}`;
      const [path, queryString] = routeToNavigateTo.split('?');
      const urlSearchParams = new URLSearchParams(queryString);
      const queryParams: Record<string, unknown> = {};
      urlSearchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      this.router.navigate([path], {
        queryParams,
        skipLocationChange: true,
      });
      window.parent.postMessage(
        {
          type: 'CLIENT_ROUTE_CHANGED',
          data: {
            route: routeToNavigateTo,
          },
        },
        '*'
      );
    }
  };
}
