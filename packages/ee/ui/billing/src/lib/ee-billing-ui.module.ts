import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ApDatePipe, UiCommonModule } from '@activepieces/ui/common';
import { PlansPageComponent } from './plans-page/plans-page.component';
import { UpgradeDialogComponent } from './upgrade-dialog/upgrade-dialog.component';
import player from 'lottie-web';
import { RouterModule } from '@angular/router';
import { TasksProgressComponent } from './tasks-progress/tasks-progress.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlanNamePipe } from './plan-name.pipe';
import { LottieComponent, provideLottieOptions } from 'ngx-lottie';


@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    MatProgressSpinnerModule,
    RouterModule,
    ApDatePipe,
    LottieComponent,
  ],
  declarations: [
    PlansPageComponent,
    UpgradeDialogComponent,
    TasksProgressComponent,
    PlanNamePipe,
  ],
  exports: [PlansPageComponent, TasksProgressComponent, UpgradeDialogComponent],
  providers: [DatePipe,
    provideLottieOptions({
      player: () => player,
    }),
  ],
})
export class EeBillingUiModule {}
