import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'planName',
  pure: true,
})
export class PlanNamePipe implements PipeTransform {
  transform(planName: string): string {
    const free = planName.startsWith('free');
    if (free) {
      return 'Pro Plan';
    }

    const pro =
      planName.startsWith('pro') ||
      planName.startsWith('growth') ||
      planName.startsWith('friends');
    if (pro) {
      return 'Pro Plan';
    }

    const ltd = planName.startsWith('ltd');
    if (ltd) {
      return 'Life Time Plan';
    }

    const unlimited = planName.startsWith('unlimited');
    if (unlimited) {
      return 'Unlimited Plan';
    }

    switch (planName) {
      case 'appsumo_activepieces_tier1':
        return 'AppSumo Tier 1';
      case 'appsumo_activepieces_tier2':
        return 'AppSumo Tier 2';
      case 'appsumo_activepieces_tier3':
        return 'AppSumo Tier 3';
      case 'appsumo_activepieces_tier4':
        return 'AppSumo Tier 4';
      case 'appsumo_activepieces_tier5':
        return 'AppSumo Tier 5';
    }
    return planName;
  }
}
