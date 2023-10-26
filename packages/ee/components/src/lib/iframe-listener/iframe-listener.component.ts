import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { interval, map, Observable, of, switchMap, tap } from 'rxjs';
const prefix = 'http://localhost:1234';
@Component({
  selector: 'app-iframe-listener',
  templateUrl: './iframe-listener.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IframeListenerComponent {
  iframeChecker$: Observable<void>;

  constructor(private router: Router) {
    this.iframeChecker$ = this.createIframeParentRouteChecker();
  }

  createIframeParentRouteChecker() {
    return of(true).pipe(
      switchMap(() => {
        let oldHref = window.parent.location.href;
        const ngRouteTarget = this.getTargetedRoutePath(
          prefix,
          window.parent.location.href
        );

        this.router.navigate([ngRouteTarget]);
        return interval(50).pipe(
          tap(() => {
            if (oldHref !== window.parent.location.href) {
              const ngRouteTarget = this.getTargetedRoutePath(
                prefix,
                window.parent.location.href
              );
              this.router.navigate([ngRouteTarget]);
              oldHref = window.parent.location.href;
            }
          })
        );
      }),
      map(() => void 0)
    );
  }
  getTargetedRoutePath(prefix: string, parentRoute: string) {
    const splitRoute = parentRoute.split(prefix);
    return splitRoute[1];
  }
}
