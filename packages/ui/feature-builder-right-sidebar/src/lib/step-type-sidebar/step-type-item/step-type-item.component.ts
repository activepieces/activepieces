import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Observable, tap } from 'rxjs';
import { FlowItemDetails, fadeIn400ms } from '@activepieces/ui/common';
import { ActionOrTriggerName } from '../const';

@Component({
  selector: 'app-step-type-item',
  templateUrl: './step-type-item.component.html',
  styleUrls: ['./step-type-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeIn400ms],
})
export class StepTypeItemComponent {
  _flowItemDetails: FlowItemDetails;
  _flowItemDetails$: Observable<FlowItemDetails | undefined>;
  @Input() clickable = true;
  @Output() actionOrTirggerClicked = new EventEmitter<ActionOrTriggerName>();
  @Input() set flowItemDetails(value: FlowItemDetails) {
    this._flowItemDetails = value;
    this.loadStepIcon(this._flowItemDetails.logoUrl || '');
  }
  @Input() set flowItemDetails$(
    value: Observable<FlowItemDetails | undefined>
  ) {
    this._flowItemDetails$ = value;
    if (this._flowItemDetails$) {
      this._flowItemDetails$ = this._flowItemDetails$.pipe(
        tap((res) => {
          this.loadStepIcon(res?.logoUrl || '');
        })
      );
    }
  }
  stepIconUrl = '';
  faInfo = faInfoCircle;
  hover = false;
  constructor(private cd: ChangeDetectorRef) {}

  loadStepIcon(url: string) {
    const itemIcon = new Image();
    itemIcon.src = url;
    itemIcon.onload = () => {
      this.stepIconUrl = url;
      this.cd.markForCheck();
    };
  }
  openDocs(url: string) {
    window.open(url, '_blank', 'noopener');
  }
}
