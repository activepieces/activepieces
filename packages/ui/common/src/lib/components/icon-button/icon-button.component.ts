import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';

@Component({
  selector: 'ap-icon-button',
  templateUrl: './icon-button.component.html',
  styleUrls: ['./icon-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconButtonComponent implements OnInit {
  @Input() color: 'primary' | 'accent' | 'warn' | '' | 'basic' | undefined;
  @Input() width: number | undefined = 15;
  @Input() iconFilename: string | undefined;
  @Input() height: number | undefined = 15;
  @Input() tooltipText = '';
  @Input() buttonDisabled = false;
  @Input() ariaLabel = '';
  @Input() tabIndex = 0;
  @Input() extraClasses = '';
  @Input() useSvgDefault = false;
  @Output() buttonClicked: EventEmitter<boolean> = new EventEmitter();
  @Input() iconUrl?: string;
  disabledClass = ' !ap-fill-disable';
  ngOnInit(): void {
    if (this.useSvgDefault) {
      this.width = undefined;
      this.height = undefined;
    }
  }

  emit() {
    this.buttonClicked.emit(true);
  }
}
