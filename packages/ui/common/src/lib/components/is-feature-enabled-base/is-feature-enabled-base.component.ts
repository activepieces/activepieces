import { ActivatedRoute } from '@angular/router';
export const featureDisabledTooltip = $localize`Please upgrade your plan`;
export class IsFeatureEnabledBaseComponent {
  isFeatureEnabled = false;
  featureDisabledTooltip = featureDisabledTooltip;
  constructor(protected activatedRoute: ActivatedRoute, resolverKey: string) {
    this.isFeatureEnabled = this.activatedRoute.snapshot.data[resolverKey];
  }
}
