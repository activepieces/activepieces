import { Component, Input } from '@angular/core';
import { forkJoin, map, Observable, take } from 'rxjs';
import { Store } from '@ngrx/store';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActionType, ApEdition, TriggerType } from '@activepieces/shared';
import { FlagService } from '@activepieces/ui/common';
import { BuilderSelectors, Step } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-edit-step-form-container',
  templateUrl: './edit-step-form-container.component.html',
  styleUrls: ['./edit-step-form-container.component.scss'],
})
export class EditStepFormContainerComponent {
  webhookUrl$: Observable<string>;
  ActionType = ActionType;
  TriggerType = TriggerType;
  ApEdition = ApEdition;
  edition$: Observable<ApEdition>;
  @Input({ required: true }) selectedStep: Step;
  /**The selected step input param doesn't change if the settings or something within change*/
  selectedSettings$ = this.store.select(
    BuilderSelectors.selectCurrentStepSettings
  );
  constructor(
    private store: Store,
    private snackbar: MatSnackBar,
    private flagService: FlagService
  ) {
    this.webhookUrl$ = forkJoin({
      flow: this.store.select(BuilderSelectors.selectCurrentFlow).pipe(take(1)),
      webhookPrefix: this.flagService.getWebhookUrlPrefix(),
    }).pipe(
      map((res) => {
        return `${res.webhookPrefix}/${res.flow.id}`;
      })
    );

    this.edition$ = this.flagService.getEdition();
  }

  copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    this.snackbar.open('Webhook URL copied to clipboard');
  }
}
