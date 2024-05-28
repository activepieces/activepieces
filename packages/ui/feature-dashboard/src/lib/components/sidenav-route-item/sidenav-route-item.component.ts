import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { Observable } from 'rxjs';
import { RouterModule } from '@angular/router';
export type SideNavRoute = {
  icon: string;
  caption: string;
  route?: string;
  effect?: () => void;
  showInSideNav$: Observable<boolean>;
  showLock$?: Observable<boolean>;
  showNotification$?: Observable<boolean | string>;
};
@Component({
  selector: 'app-sidenav-route-item',
  standalone: true,
  imports: [CommonModule, UiCommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if(sideNavRoute.showInSideNav$ | async){
    <div
      class="ap-w-full ap-flex-col ap-flex ap-border-transparent ap-justify-center ap-items-center ap-cursor-pointer"
      [routerLink]="sideNavRoute.route ? ['/' + sideNavRoute.route] : undefined"
      (click)="sideNavRoute.effect ? sideNavRoute.effect() : null"
      [skipLocationChange]="skipLocationChange"
    >
      <div
        routerLinkActive="ap-bg-primary-light   ap-transition ap-ease-out ap-rounded-[8px] hover:!ap-bg-primary-light !ap-fill-primary "
        class="hover:ap-bg-[#f5f5f5] ap-relative ap-p-3 ap-fill-title "
        [routerLink]="
          sideNavRoute.route ? ['/' + sideNavRoute.route] : undefined
        "
        [skipLocationChange]="skipLocationChange"
      >
        <svg-icon
          [applyClass]="true"
          class="ap-fill-inherit"
          [svgStyle]="{ width: '21px', height: '21px' }"
          [src]="sideNavRoute.icon"
        >
        </svg-icon>
        @if(sideNavRoute.showLock$ | async){
        <svg-icon
          [applyClass]="true"
          class="ap-fill-disable ap-bottom-[1px] ap-right-[1px] ap-absolute"
          [svgStyle]="{ width: '14px', height: '14px' }"
          src="assets/img/custom/lock.svg"
        >
        </svg-icon>
        } @if(sideNavRoute.showNotification$ | async) {
        <svg-icon
          [applyClass]="true"
          class="ap-fill-danger ap-top-[4px] ap-right-[3px] ap-absolute"
          [svgStyle]="{ width: '8px', height: '8px' }"
          src="assets/img/custom/notification_important.svg"
        >
        </svg-icon>
        }
      </div>

      <div class="ap-font-medium ap-text-[10px] ap-text-center">
        {{ sideNavRoute.caption }}
      </div>
    </div>
    }
  `,
})
export class SidenavRouteItemComponent {
  @Input({ required: true }) sideNavRoute: SideNavRoute;
  @Input() skipLocationChange?: boolean;

  readonly newUpdateMessage = $localize`New update available`;
}
