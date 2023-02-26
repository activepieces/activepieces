import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { ThemeService } from '../../../common/service/theme.service';

@Component({
  selector: 'app-sidebar-header',
  templateUrl: './sidebar-header.component.html',
  styleUrls: ['./sidebar-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarHeaderComponent implements OnChanges {
  faChevronLeft = faChevronLeft;
  @Input() title: string;
  @Input() backArrow = false;

  @Output() backArrowClicked: EventEmitter<void> = new EventEmitter<void>();
  @Output() closeClicked: EventEmitter<void> = new EventEmitter<void>();

  constructor(
    public themeService: ThemeService,
    private cd: ChangeDetectorRef
  ) {}
  ngOnChanges(): void {
    setTimeout(() => {
      //trigger drawerTitle width change detection
      this.cd.detectChanges();
    }, 100);
  }
}
