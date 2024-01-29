import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { InstanceRunService } from '@activepieces/ui/common';
import { FlowRun } from '@activepieces/shared';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-runs-list',
  templateUrl: './runs-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsListComponent implements OnInit {
  @Input({
    required: true,
  })
  projectId!: string;
  runs$!: Observable<FlowRun[]>;
  constructor(private instanceRunService: InstanceRunService) {}
  ngOnInit(): void {
    this.runs$ = this.instanceRunService
      .list(this.projectId, {
        cursor: '',
        limit: 50,
      })
      .pipe(map((res) => res.data));
  }
}
