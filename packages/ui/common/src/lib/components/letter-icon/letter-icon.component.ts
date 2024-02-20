import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ap-letter-icon',
  templateUrl: './letter-icon.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LetterIconComponent {
  @Input() letter: string;
}
