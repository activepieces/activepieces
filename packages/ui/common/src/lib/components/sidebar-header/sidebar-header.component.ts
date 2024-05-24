import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
@Component({
  selector: 'ap-sidebar-header',
  templateUrl: './sidebar-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarHeaderComponent implements OnChanges {
  @Input() headerTitle: string;
  @Output() closeClicked: EventEmitter<void> = new EventEmitter<void>();

  constructor(private cd: ChangeDetectorRef) {}
  ngOnChanges(): void {
    setTimeout(() => {
      //trigger drawerTitle width change detection
      this.cd.markForCheck();
    }, 100);
  }
}
