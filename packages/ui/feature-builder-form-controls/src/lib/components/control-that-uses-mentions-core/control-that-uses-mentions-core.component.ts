import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnrichedStepMetaDataForMentions } from '@activepieces/ui/feature-builder-store';

@Component({
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class ControlThatUsesMentionsCoreComponent {
  @Input({ required: true })
  stepMetaDataForMentions: EnrichedStepMetaDataForMentions[] = [];
}
