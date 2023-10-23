import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import {
  AppConnectionStatus,
  ExecutionOutputStatus,
  StepOutputStatus,
} from '@activepieces/shared';

@Component({
  selector: 'ap-state-icon',
  templateUrl: './state-icon.component.html',
})
export class StateIconComponent implements OnInit, OnChanges {
  @Input() size = 16;
  @Input() showStatusText = true;
  @Input() status:
    | ExecutionOutputStatus
    | StepOutputStatus
    | AppConnectionStatus;
  textAfter = '';
  readonly ExecutionOutputStatus = ExecutionOutputStatus;
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
    status: ExecutionOutputStatus | StepOutputStatus | AppConnectionStatus
  ): string {
    switch (status) {
      case ExecutionOutputStatus.STOPPED:
      case ExecutionOutputStatus.SUCCEEDED:
      case StepOutputStatus.SUCCEEDED:
      case StepOutputStatus.STOPPED:
      case AppConnectionStatus.ACTIVE:
        return 'assets/img/custom/status/success.svg';
      case ExecutionOutputStatus.FAILED:
      case ExecutionOutputStatus.INTERNAL_ERROR:
      case ExecutionOutputStatus.TIMEOUT:
      case StepOutputStatus.FAILED:
      case AppConnectionStatus.ERROR:
      case ExecutionOutputStatus.QUOTA_EXCEEDED:
        return 'assets/img/custom/status/error.svg';
      case ExecutionOutputStatus.PAUSED:
      case StepOutputStatus.PAUSED:
        return 'assets/img/custom/status/paused.svg';
      case StepOutputStatus.RUNNING:
      case ExecutionOutputStatus.RUNNING:
        return '';
    }
  }
  findTextAfter(
    status: ExecutionOutputStatus | StepOutputStatus | AppConnectionStatus
  ): string {
    switch (status) {
      case ExecutionOutputStatus.STOPPED:
      case ExecutionOutputStatus.SUCCEEDED:
      case StepOutputStatus.SUCCEEDED:
      case StepOutputStatus.STOPPED:
        return $localize`Succeeded`;
      case ExecutionOutputStatus.QUOTA_EXCEEDED:
        return 'Quota Exceeded';
      case ExecutionOutputStatus.INTERNAL_ERROR:
        return $localize`Internal Error`;
      case ExecutionOutputStatus.TIMEOUT:
        return $localize`Timed Out`;
      case ExecutionOutputStatus.FAILED:
      case StepOutputStatus.FAILED:
        return $localize`Failed`;
      case ExecutionOutputStatus.PAUSED:
      case StepOutputStatus.PAUSED:
        return $localize`Paused`;
      case ExecutionOutputStatus.RUNNING:
      case StepOutputStatus.RUNNING:
        return $localize`Running`;
      case AppConnectionStatus.ACTIVE:
        return $localize`Active`;
      case AppConnectionStatus.ERROR:
        return $localize`Error`;
    }
  }
}
