import { ChangeDetectionStrategy, Component } from '@angular/core';
import { fadeIn400ms } from '@activepieces/ui/common';
import { CollectionBuilderService } from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-ai-generated-flow-feedback',
  templateUrl: './ai-generated-flow-feedback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class AiGeneratedFlowFeedbackComponent {
  constructor(private builderService: CollectionBuilderService) {}
  close() {
    this.builderService.componentToShowInsidePortal$.next(undefined);
  }
}
