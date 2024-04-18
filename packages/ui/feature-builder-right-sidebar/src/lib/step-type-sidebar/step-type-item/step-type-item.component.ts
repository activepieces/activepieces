import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { Observable, Subject, tap } from 'rxjs';
import { FlowItemDetails, fadeIn400ms } from '@activepieces/ui/common';
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';

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
  @Output() suggestionClicked = new EventEmitter<ActionBase | TriggerBase>();
  @Input() clickable = true;
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
  loadingLogo$: Subject<boolean> = new Subject<boolean>();
  faInfo = faInfoCircle;
  constructor() {
    this.loadingLogo$.next(true);
  }

  loadStepIcon(url: string) {
    const itemIcon = new Image();
    itemIcon.src = url;
    itemIcon.onload = () => {
      this.loadingLogo$.next(false);
    };
  }
  openDocs(url: string) {
    window.open(url, '_blank', 'noopener');
  }
}
