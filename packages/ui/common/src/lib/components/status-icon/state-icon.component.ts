import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  AppConnectionStatus,
  FlowExecutionStatus,
  StepOutputStatus,
} from '@activepieces/shared';

@Component({
  selector: 'ap-state-icon',
  templateUrl: './state-icon.component.html',
})
export class StateIconComponent implements OnInit, OnChanges {
  @Input() size = 16;
  @Input() showStatusText = true;
  @Input() status: FlowExecutionStatus | StepOutputStatus | AppConnectionStatus;
  textAfter = '';
  readonly ExecutionOutputStatus = FlowExecutionStatus;
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
    status: FlowExecutionStatus | StepOutputStatus | AppConnectionStatus
  ): string {
    switch (status) {
      case FlowExecutionStatus.STOPPED:
      case FlowExecutionStatus.SUCCEEDED:
      case StepOutputStatus.SUCCEEDED:
      case StepOutputStatus.STOPPED:
      case AppConnectionStatus.ACTIVE:
        return 'assets/img/custom/status/success.svg';
      case FlowExecutionStatus.FAILED:
      case FlowExecutionStatus.INTERNAL_ERROR:
      case FlowExecutionStatus.TIMEOUT:
      case StepOutputStatus.FAILED:
      case AppConnectionStatus.ERROR:
      case FlowExecutionStatus.QUOTA_EXCEEDED:
        return 'assets/img/custom/status/error.svg';
      case FlowExecutionStatus.PAUSED:
      case StepOutputStatus.PAUSED:
        return 'assets/img/custom/status/paused.svg';
      case StepOutputStatus.RUNNING:
      case FlowExecutionStatus.RUNNING:
        return '';
    }
  }
  findTextAfter(
    status: FlowExecutionStatus | StepOutputStatus | AppConnectionStatus
  ): string {
    switch (status) {
      case FlowExecutionStatus.STOPPED:
      case FlowExecutionStatus.SUCCEEDED:
      case StepOutputStatus.SUCCEEDED:
      case StepOutputStatus.STOPPED:
        return $localize`Succeeded`;
      case FlowExecutionStatus.QUOTA_EXCEEDED:
        return 'Quota Exceeded';
      case FlowExecutionStatus.INTERNAL_ERROR:
        return $localize`Internal Error`;
      case FlowExecutionStatus.TIMEOUT:
        return $localize`Timed Out`;
      case FlowExecutionStatus.FAILED:
      case StepOutputStatus.FAILED:
        return $localize`Failed`;
      case FlowExecutionStatus.PAUSED:
      case StepOutputStatus.PAUSED:
        return $localize`Paused`;
      case FlowExecutionStatus.RUNNING:
      case StepOutputStatus.RUNNING:
        return $localize`Running`;
      case AppConnectionStatus.ACTIVE:
        return $localize`Active`;
      case AppConnectionStatus.ERROR:
        return $localize`Error`;
    }
  }
}
