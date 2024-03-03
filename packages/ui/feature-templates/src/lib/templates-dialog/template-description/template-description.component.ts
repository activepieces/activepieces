import { FlowTemplate } from '@activepieces/shared';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-template-description',
  templateUrl: './template-description.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateDescriptionComponent {
  @Input({ required: true }) template: FlowTemplate;
}
