import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivationKeysService,
  ContactSalesService,
  FlagService,
  UiCommonModule,
  fadeIn400ms,
} from '@activepieces/ui/common';
import { ApEdition } from '@activepieces/shared';
import { Observable, map, of, shareReplay, switchMap, tap } from 'rxjs';

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
        }@else { <b i18n>Trial Ended</b> } }
      </div>
    </ap-button>
    } @else() {
    <ap-button
      btnColor="white"
      btnStyle="stroked"
      btnSize="medium"
      (buttonClicked)="openRequestTrialDialog()"
      i18n
    >
      <div class="ap-flex ap-gap-7 ap-items-center">
        <ap-hotspot> </ap-hotspot>
        <b>Free Trial</b>
      </div>
    </ap-button>
    } } @if(openDialog$ | async) {} `,
})
export class RequestTrialButtonComponent {
  showButton$: Observable<boolean>;
  openDialog$: Observable<boolean>;
  //TODO: Add a check to see if platform has key and the key is trial
  isTrialKeyActivated$: Observable<boolean>;
  //TODO: Add actual calculation
  durationUntilTrialEnds$: Observable<number>;
  constructor(
    private flagsService: FlagService,
    private contactSalesService: ContactSalesService,
    private activationKeysService: ActivationKeysService
  ) {
    // TODO: Add another check to see if platform has key and the key isn't trial
    const platformKeyStatus$ = this.activationKeysService
      .getPlatformKeyStatus()
      .pipe(tap(console.log), shareReplay(1));
    this.showButton$ = this.flagsService.getEdition().pipe(
      switchMap((ed) => {
        if (ed === ApEdition.ENTERPRISE) {
          console.log('Enterprise');
          return platformKeyStatus$.pipe(
            map((res) => !res.valid || res.isTrial)
          );
        }
        return of(false);
      })
    );
    this.isTrialKeyActivated$ = platformKeyStatus$.pipe(
      map((res) => res.isTrial)
    );
    this.durationUntilTrialEnds$ = platformKeyStatus$.pipe(
      map((res) => {
        if (res.expirayDate) {
          const now = new Date();
          const trialEnd = new Date(res.expirayDate);
          const diffInTime = trialEnd.getTime() - now.getTime();
          return diffInTime;
        }
        return -1;
      })
    );
  }

  openRequestTrialDialog() {
    this.openDialog$ = this.activationKeysService.openTrialDialog();
  }

  openContactSales(): void {
    this.contactSalesService.open([]);
  }
}
