import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { PlansPageComponent } from './plans-page/plans-page.component';
import { UpgradeDialogComponent } from './upgrade-dialog/upgrade-dialog.component';
import { LottieModule } from 'ngx-lottie';
import player from 'lottie-web';
import { RouterModule } from '@angular/router';
import { TasksProgressComponent } from './tasks-progress/tasks-progress.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlanNamePipe } from './plan-name.pipe';
import { BillingSidenavItemComponent } from './billing-sidenav-item/billing-sidenav-item.component';

export function playerFactory() {
  return player;
}

@NgModule({
  imports: [
    CommonModule,
    UiCommonModule,
    MatProgressSpinnerModule,
    LottieModule.forRoot({ player: playerFactory }),
    RouterModule,
  ],
  declarations: [
    PlansPageComponent,
    UpgradeDialogComponent,
    TasksProgressComponent,
    PlanNamePipe,
    BillingSidenavItemComponent,
  ],
  exports: [
    PlansPageComponent,
    TasksProgressComponent,
    UpgradeDialogComponent,
    BillingSidenavItemComponent,
  ],
})
export class EeBillingUiModule {}
