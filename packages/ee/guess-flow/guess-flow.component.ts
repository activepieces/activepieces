import {
  ChangeDetectionStrategy,
  Component,

} from '@angular/core';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-guess-flow',
  templateUrl: './guess-flow.component.html',
  styleUrls: ['./guess-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuessFlowComponent {

  closeContainer= new Subject<boolean>();

}
