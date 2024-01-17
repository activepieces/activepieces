import { ActivatedRoute } from '@angular/router';

export class IsFeatureEnabledBaseComponent {
  isFeatureEnabled = false;
  featureDisabledTooltip = $localize`Please upgrade your plan`;
  constructor(private activatedRoute: ActivatedRoute, resolverKey: string) {
    this.isFeatureEnabled = this.activatedRoute.snapshot.data[resolverKey];
  }
}
