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
import { Observable, map, of } from 'rxjs';

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
        @if( daysUntilTrialEnd$ | async; as daysUntilTrialEnds) {
        <svg-icon
          class="ap-w-[16px] ap-h-[16px] ap-fill-body "
          [class.ap-rotate-180]="daysUntilTrialEnds > 0"
          src="assets/img/custom/duration.svg"
          [applyClass]="true"
        >
        </svg-icon>
        @if(daysUntilTrialEnds > 0) {
        <div i18n>
          <b>{{ daysUntilTrialEnds }}</b> Days Left
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
  isTrialKeyActivated$ = of(false);
  //TODO: Add actual calculation
  daysUntilTrialEnd$ = of(this.calculateDaysUntilTrialEnds());
  constructor(
    private flagsService: FlagService,
    private contactSalesService: ContactSalesService,
    private activationKeysService: ActivationKeysService
  ) {
    // TODO: Add another check to see if platform has key and the key isn't trial
    this.showButton$ = this.flagsService.getEdition().pipe(
      map((env) => {
        return env !== ApEdition.CLOUD;
      })
    );
  }

  openRequestTrialDialog() {
    this.openDialog$ = this.activationKeysService.openTrialDialog();
  }

  calculateDaysUntilTrialEnds() {
    const now = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(now.getDate() + 5);
    const diffInTime = trialEnd.getTime() - now.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    return Math.ceil(diffInDays);
  }

  openContactSales(): void {
    this.contactSalesService.open([]);
  }
}
