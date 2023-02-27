import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-mention-list-item-template',
  templateUrl: './mention-list-item-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MentionListItemTemplateComponent {
  @Input() itemLabel: string;
  @Input() itemIconUrl: string;
}
