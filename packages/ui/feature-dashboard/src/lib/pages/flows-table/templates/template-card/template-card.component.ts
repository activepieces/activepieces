import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-template-card',
  templateUrl: './template-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateCardComponent {
  urls = [
    'assets/img/custom/piece/webhook_mention.png',
    'assets/img/custom/piece/code_mention.png',
    'assets/img/custom/piece/branch_mention.png',
  ];
}
