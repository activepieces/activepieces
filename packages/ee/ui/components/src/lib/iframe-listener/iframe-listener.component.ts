import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActivepiecesVendorEventName,
  ActivepiecesVendorRouteChanged,
} from 'ee-embed-sdk';
import { EmbeddingService } from '@activepieces/ui/common';
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
    event: MessageEvent<ActivepiecesVendorRouteChanged>
  ) => {
    if (
      event.source === window.parent &&
      event.data.type === ActivepiecesVendorEventName.VENDOR_ROUTE_CHANGED
    ) {
      const targetRoute = event.data.data.vendorRoute;
      const [path, queryString] = targetRoute.split('?');
      const urlSearchParams = new URLSearchParams(queryString);
      const queryParams: Record<string, unknown> = {};
      urlSearchParams.forEach((value, key) => {
        queryParams[key] = value;
      });
      this.router.navigate([path], {
        queryParams,
        skipLocationChange: true,
      });
    }
  };
}
