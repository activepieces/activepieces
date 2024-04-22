import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { EmbeddingService, UiCommonModule } from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import { isNil } from '@activepieces/shared';

@Component({
  selector: 'app-connection-name-control',
  standalone: true,
  imports: [UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-form-field class="ap-w-full" appearance="outline">
      <mat-label i18n>Name</mat-label>
      <input
        [matTooltip]="keyTooltip"
        cdkFocusInitial
        [formControl]="control"
        matInput
        type="text"
      />
      <mat-error *ngIf="control.invalid">
        @if( control.getError('required')) {
        <ng-container i18n>Name is required</ng-container>
        } @else if(control.getError('pattern')) {
        <ng-container i18n>
          Name can only contain letters, numbers and underscores
        </ng-container>

        } @else if(control.getError('nameUsed')) {
        <ng-container i18n> Name is already used </ng-container>
        }
      </mat-error>
    </mat-form-field>
  `,
})
export class ConnectionNameControlComponent implements OnInit {
  @Input({ required: true }) control!: FormControl;
  constructor(private embeddingService: EmbeddingService) {}
  ngOnInit(): void {
    if (
      !isNil(this.embeddingService.getPredefinedConnectionName()) &&
      this.embeddingService.getPredefinedConnectionName() !== ''
    ) {
      this.control.setValue(
        this.embeddingService.getPredefinedConnectionName()
      );
      this.control.disable();
    }
  }
  readonly keyTooltip = $localize`The ID of this connection definition. You will need to select this key whenever you want to reuse this connection`;
}
