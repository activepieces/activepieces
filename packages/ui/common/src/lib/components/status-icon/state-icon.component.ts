import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  AppConnectionStatus,
  FlowRunStatus,
  StepOutputStatus,
} from '@activepieces/shared';

@Component({
  selector: 'ap-state-icon',
  templateUrl: './state-icon.component.html',
})
export class StateIconComponent implements OnInit, OnChanges {
  @Input() size = 16;
  @Input() showStatusText = true;
  @Input() status: FlowRunStatus | StepOutputStatus | AppConnectionStatus;
  textAfter = '';
  readonly ExecutionOutputStatus = FlowRunStatus;
  readonly StepOutputStatus = StepOutputStatus;

  iconUrl = '';
  ngOnInit(): void {
    this.textAfter = this.findTextAfter(this.status);
    this.iconUrl = this.findIconUrl(this.status);
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.textAfter = this.findTextAfter(this.status);
    this.iconUrl = this.findIconUrl(this.status);
  }
  findIconUrl(
    status: FlowRunStatus | StepOutputStatus | AppConnectionStatus
  ): string {
    switch (status) {
      case FlowRunStatus.STOPPED:
      case FlowRunStatus.SUCCEEDED:
      case StepOutputStatus.SUCCEEDED:
      case StepOutputStatus.STOPPED:
      case AppConnectionStatus.ACTIVE:
        return 'assets/img/custom/status/success.svg';
      case FlowRunStatus.FAILED:
      case FlowRunStatus.INTERNAL_ERROR:
      case FlowRunStatus.TIMEOUT:
      case StepOutputStatus.FAILED:
      case AppConnectionStatus.ERROR:
      case FlowRunStatus.QUOTA_EXCEEDED:
        return 'assets/img/custom/status/error.svg';
      case FlowRunStatus.PAUSED:
      case StepOutputStatus.PAUSED:
        return 'assets/img/custom/status/paused.svg';
      case StepOutputStatus.RUNNING:
      case FlowRunStatus.RUNNING:
        return '';
    }
  }
  findTextAfter(
    status: FlowRunStatus | StepOutputStatus | AppConnectionStatus
  ): string {
    switch (status) {
      case FlowRunStatus.STOPPED:
      case FlowRunStatus.SUCCEEDED:
      case StepOutputStatus.SUCCEEDED:
      case StepOutputStatus.STOPPED:
        return $localize`Succeeded`;
      case FlowRunStatus.QUOTA_EXCEEDED:
        return 'Quota Exceeded';
      case FlowRunStatus.INTERNAL_ERROR:
        return $localize`Internal Error`;
      case FlowRunStatus.TIMEOUT:
        return $localize`Timed Out`;
      case FlowRunStatus.FAILED:
      case StepOutputStatus.FAILED:
        return $localize`Failed`;
      case FlowRunStatus.PAUSED:
      case StepOutputStatus.PAUSED:
        return $localize`Paused`;
      case FlowRunStatus.RUNNING:
      case StepOutputStatus.RUNNING:
        return $localize`Running`;
      case AppConnectionStatus.ACTIVE:
        return $localize`Active`;
      case AppConnectionStatus.ERROR:
        return $localize`Error`;
    }
  }
}
