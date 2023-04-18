import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { RunsLeftSnackbarComponent } from './runs-left-snackbar/runs-left-snackbar.component';

@NgModule({
  imports: [CommonModule, UiCommonModule],
  declarations: [RunsLeftSnackbarComponent],
  exports: [RunsLeftSnackbarComponent],
})
export class EeBillingUiModule {}
