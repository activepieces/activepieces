import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { fadeInUp400ms } from '@activepieces/ui/common';
import { PromptTemplate } from '../../prompt-templates';

@Component({
  selector: 'app-prompt-icons',
  templateUrl: './prompt-icons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInUp400ms],
})
export class PromptIconsComponent {
  @Input()
  isHovered = false;
  @Input()
  prompt: PromptTemplate;
}
