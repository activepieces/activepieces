import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-guess-flow',
  templateUrl: './guess-flow.component.html',
  styleUrls: ['./guess-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuessFlowComponent {
  @Output()
  hideGuessFlowComponent = new EventEmitter<boolean>();
}
