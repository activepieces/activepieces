import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LicenseKeysService,
  FlagService,
  UiCommonModule,
  fadeIn400ms,
  ContactSalesDialogComponent,
  ContactSalesService,
} from '@activepieces/ui/common';
import { ApEdition, isNil } from '@activepieces/shared';
import { Observable, catchError, map, of, shareReplay, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import dayjs from 'dayjs';

@Component({
  selector: 'app-request-trial-button-component',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
  template: `@if(showButton$ | async) { @if(isTrialKeyActivated$ | async) {
    <ap-button
      btnColor="white"
      btnStyle="stroked"
      btnSize="medium"
      (buttonClicked)="openContactSales()"
    >
      <div class="ap-flex ap-gap-1 ap-items-center">
        @if( durationUntilTrialEnds$ | async; as durationUntilTrialEnds) {
        <svg-icon
          class="ap-w-[16px] ap-h-[16px] ap-fill-body "
          [class.ap-rotate-180]="durationUntilTrialEnds > 0"
          src="assets/img/custom/duration.svg"
          [applyClass]="true"
        >
        </svg-icon>
        @if(durationUntilTrialEnds > 0) {
        <div>
          <b>
            {{ durationUntilTrialEnds | durationFormatter : false : false }}
          </b>
          <ng-container> left </ng-container>
        </div>
        }@else { <b i18n>Contact Sales</b> } }
      </div>
    </ap-button>
    } @else() {
    <ap-button
      btnColor="white"
      btnStyle="stroked"
      btnSize="medium"
      (buttonClicked)="openEnterpriseTrialSlide()"
      i18n
    >
      <div class="ap-flex ap-gap-7 ap-items-center">
        <ap-hotspot> </ap-hotspot>
        <b>Try Enterprise</b>
      </div>
    </ap-button>
    } } `,
})
export class RequestTrialButtonComponent {
  showButton$: Observable<boolean>;
  isTrialKeyActivated$: Observable<boolean>;
  durationUntilTrialEnds$: Observable<number>;
  constructor(
    private flagsService: FlagService,
    private matDialog: MatDialog,
    private licenseKeysService: LicenseKeysService,
    private contactSalesService: ContactSalesService
  ) {
    // TODO: Add another check to see if platform has key and the key isn't trial
    const platformKeyStatus$ = this.licenseKeysService
      .getKey()
      .pipe(shareReplay(1));
    this.showButton$ = this.flagsService.getEdition().pipe(
      switchMap((ed) => {
        switch (ed) {
          case ApEdition.ENTERPRISE:
            return platformKeyStatus$.pipe(
              map((res) => res.isTrial),
              catchError(() => of(false))
            );
          case ApEdition.COMMUNITY:
            return of(true);
          default:
            return of(false);
        }
      })
    );
    this.isTrialKeyActivated$ = platformKeyStatus$.pipe(
      map((res) => res.isTrial)
    );
    this.durationUntilTrialEnds$ = platformKeyStatus$.pipe(
      map((res) => {
        return isNil(res.expiresAt)
          ? -1
          : dayjs(res.expiresAt).diff(dayjs(), 'milliseconds');
      })
    );
  }

  openEnterpriseTrialSlide() {
    this.contactSalesService.open('Try Enterprise in Dashboard');
  }

  openContactSales(): void {
    this.matDialog.open(ContactSalesDialogComponent, {
      autoFocus: '.agree-button',
    });
  }
}
