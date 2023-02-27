import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent {
  @Input() color: 'primary' | 'accent' | 'warn' | '';
  @Input() width = 15;
  @Input() iconFilename: string;
  @Input() height = 15;
  @Input() tooltipText = '';
  @Input() buttonDisabled = false;
  @Input() ariaLabel = '';
  @Output() buttonClicked: EventEmitter<boolean> = new EventEmitter();
}
