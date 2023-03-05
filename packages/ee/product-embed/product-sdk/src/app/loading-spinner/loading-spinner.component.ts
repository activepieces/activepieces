import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingSpinnerComponent implements OnInit {
  parentIsOutlineButton = false;
  hoveringClass = 'loading-icon-hover';
  @Input()
  svgClasses = 'loading-icon';
  @Input()
  isGreySpinner = false;
  @Input()
  isLarge = false;
  constructor(private cd: ChangeDetectorRef) {}
  ngOnInit(): void {
    if (this.parentIsOutlineButton) {
      this.svgClasses = this.svgClasses.concat(' ', 'loading-icon-outline');
    }
    if (this.isGreySpinner) {
      this.svgClasses = this.svgClasses.concat(' ', 'loading-icon-grey');
    }
    if (this.isLarge) {
      this.svgClasses = this.svgClasses.concat(' ', 'loading-icon-large');
    }
  }
  detectChanges() {
    this.cd.detectChanges();
  }
}
