import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';
import { FormControl } from '@angular/forms';
import {
  DropdownOption,
  PieceAuthProperty,
  PieceMetadataSummary,
} from '@activepieces/pieces-framework';
import { DropdownSelectedValuesPipe } from '../pipes/dropdown-selected-values.pipe';
import { UiFeatureConnectionsModule } from '@activepieces/ui/feature-connections';

//TODO: check add-edit-connection-button and remove unnecessary properties and ask mo about triggerName
@Component({
  selector: 'app-dropdown-search-control',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    DropdownSelectedValuesPipe,
    UiFeatureConnectionsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ap-relative">
      <mat-form-field
        subscriptSizing="dynamic"
        class="ap-w-full"
        appearance="outline"
        #dropdown
        #dropdownUiContainer="hoverTrackerDirective"
        apTrackHover
      >
        <mat-label> Connection </mat-label>
        <mat-select [formControl]="formControl">
          @for( opt of options; track opt.value){
          <mat-option [value]="opt.value">
            {{ opt.label }}
          </mat-option>
          }

          <mat-option
            (click)="addConnectionBtn.buttonClicked()"
            class="add-auth"
          >
            <div class="ap-flex">
              <div
                class="ap-flex-grow ap-text-primary ap-flex ap-gap-2 ap-font-bold ap-items-center"
              >
                <svg-icon
                  src="assets/img/custom/add.svg"
                  [applyClass]="true"
                  class="ap-fill-primary ap-w-[13px]  ap-h-[13px] "
                ></svg-icon>
                New Connection
              </div>
            </div>
          </mat-option>
          <mat-select-trigger>
            <div
              class="ap-flex ap-gap-[6px] connections-dropdown-container ap-pr-1 ap-items-center"
            >
              <div class="ap-w-full ap-truncate">
                @if((options | dropdownSelectedValues: formControl | async); as
                selectedValues){
                {{ selectedValues[0].label }}
                }
              </div>
              <div>
                @if(formControl.value) {
                <app-add-edit-connection-button
                  (click)="$event.stopPropagation()"
                  btnSize="extraSmall"
                  [isEditConnectionButton]="true"
                  [authProperty]="property"
                  [pieceName]="pieceMetaData.name"
                  [pieceVersion]="pieceMetaData.version"
                  [propertyKey]="''"
                  [pieceDisplayName]="pieceMetaData.displayName"
                  [selectedConnectionInterpolatedString]="formControl.value"
                  [triggerName]="''"
                  (connectionPropertyValueChanged)="
                    formControl.setValue($event.value)
                  "
                >
                  <div class="ap-px-2" i18n>Reconnect</div>
                </app-add-edit-connection-button>
                }
              </div>
            </div>
          </mat-select-trigger>
        </mat-select>
      </mat-form-field>
      <app-add-edit-connection-button
        #addConnectionBtn
        btnSize="medium"
        class="ap-hidden"
        [isEditConnectionButton]="false"
        [authProperty]="property"
        [pieceName]="pieceMetaData.name"
        [pieceVersion]="pieceMetaData.version"
        [propertyKey]="''"
        [triggerName]="''"
        [pieceDisplayName]="pieceMetaData.displayName"
        (connectionPropertyValueChanged)="formControl.setValue($event.value)"
      >
      </app-add-edit-connection-button>
    </div>
  `,
})
export class ConnectionsDropdownControlComponent {
  @Input({ required: true }) formControl: FormControl<string>;
  @Input({ required: true })
  options: DropdownOption<`{{connections['${string}']}}`>[];
  @Input({ required: true }) property: PieceAuthProperty;
  @Input({ required: true }) pieceMetaData: PieceMetadataSummary;
}
