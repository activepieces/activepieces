import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'ap-button',
  templateUrl: './ap-button.component.html',
  styleUrls: ['./ap-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApButtonComponent {
  _disabled: true | false | null = false;
  @Input() onlyShowContent = false;
  @Input() loading = false;
  @Input() btnStyle: 'flat' | 'raised' | 'stroked' | 'basic' = 'flat';
  @Input() btnColor: 'primary' | 'warn' | 'success' | 'basic' | 'white' =
    'primary';
  @Input() set disabled(val: true | false | null) {
    this._disabled = val;
  }
  @Input() darkLoadingSpinner = false;
  @Input() fullWidthOfContainer = false;
  @Input() tooltipDisabled = false;
  @Input() tooltipText = '';
  @Input() type: 'submit' | 'button' = 'submit';
  @Input() buttonIsInsideAutocomplete = false;
  @Input() set btnSize(
    value: 'extraSmall' | 'small' | 'medium' | 'large' | 'default'
  ) {
    this.btnSizeClass = this.btnClassesMap.get(value)!;
  }

  get disabled() {
    return this._disabled;
  }
  btnClassesMap: Map<string, string> = new Map(
    Object.entries({
      default: '',
      extraSmall: 'ap-btn-xs',
      small: 'ap-btn-sm',
      medium: 'ap-btn-m',
      large: 'ap-btn-l',
    })
  );
  btnSizeClass = 'ap-btn-l';
  @Output() buttonClicked: EventEmitter<Event> = new EventEmitter<Event>();

  click() {
    if (!this.loading) {
      this.buttonClicked.emit();
    }
  }
}
