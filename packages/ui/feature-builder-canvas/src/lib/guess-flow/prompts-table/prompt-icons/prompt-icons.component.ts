import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-prompt-icons',
  templateUrl: './prompt-icons.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptIconsComponent {
  @Input()
  prompt: {
    content: string;
    urls: string[];
    more: number;
  };
}
