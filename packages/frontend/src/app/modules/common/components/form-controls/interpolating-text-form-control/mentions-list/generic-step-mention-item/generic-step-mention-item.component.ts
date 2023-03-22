import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { FlowItemDetails } from '../../../../../../flow-builder/page/flow-builder/flow-right-sidebar/step-type-sidebar/step-type-item/flow-item-details';
import { BuilderSelectors } from '../../../../../../flow-builder/store/builder/builder.selector';
import { FlowItem } from '../../../../../model/flow-builder/flow-item';
import { MentionListItem } from '../../utils';

@Component({
  selector: 'app-generic-step-mention-item',
  templateUrl: './generic-step-mention-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenericStepMentionItemComponent implements OnInit {
  @Input() indentation = false;
  @Input() stepMention: MentionListItem & { step: FlowItem };
  @Input() stepIndex: number;
  flowItemDetails$: Observable<FlowItemDetails | undefined>;
  constructor(private store: Store) {}
  ngOnInit(): void {
    this.flowItemDetails$ = this.store.select(
      BuilderSelectors.selectFlowItemDetails(this.stepMention.step)
    );
  }
}
