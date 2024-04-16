import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UiCommonModule } from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-connection-name-control',
  standalone: true,
  imports: [UiCommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <mat-form-field class="ap-w-full" appearance="outline">
    <mat-label i18n>Name</mat-label>
    <input
      [matTooltip]="keyTooltip"
      cdkFocusInitial
      [formControl]="formControl"
      matInput
      type="text"
    />
    <mat-error *ngIf="formControl.invalid">
      @if( formControl.getError('required')) {
      <ng-container i18n>Name is required</ng-container>
      } @else if(formControl.getError('pattern')) {
      <ng-container i18n>
        Name can only contain letters, numbers and underscores
      </ng-container>

      } @else if(formControl.getError('nameUsed')) {
      <ng-container i18n> Name is already used </ng-container>
      }
    </mat-error>
  </mat-form-field>`,
})
export class ConnectionNameControlComponent {
  @Input({ required: true }) formControl!: FormControl;
  readonly keyTooltip = $localize`The ID of this connection definition. You will need to select this key whenever you want to reuse this connection`;
}
