import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { fadeInUp400ms } from '@activepieces/ui/common';

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
  prompt: {
    content: string;
    urls: string[];
    more: number;
  };
}
