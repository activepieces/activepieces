import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
export const IS_FEATURE_ENABLED_RESOLVER_KEY = 'isFeatureEnabled';
@Component({
  standalone: true,
  imports: [CommonModule],
  template: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsFeatureEnabledBaseComponent {
  isFeatureEnabled = false;
  constructor(private activatedRoute: ActivatedRoute) {
    this.isFeatureEnabled =
      this.activatedRoute.snapshot.data['isFeatureEnabled'];
  }
}
