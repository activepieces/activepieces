import { ArrayProperty } from '@activepieces/pieces-framework';
import { Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'array-form-control-object-item',
  template: `
  <mat-card appearance="outlined" class="ap-my-2">
    <mat-card-header class="ap-w-full  !ap-p-3 ap-mb-1 !ap-block">
      <mat-card-title>
        <div class="ap-flex ap-items-center ap-select-none ap-justify-between  ap-h-[3rem] ap-w-full">
          <div class=" ap-mx-3 ap-typography-body-1">
            #{{ idx+1 }}
          </div>
          <ap-icon-button [width]="9" [height]="9" iconFilename="delete.svg" [matTooltip]="removeItemTooltip"
           (buttonClicked)="removeValue.emit(idx)" apTrackHover="hoverTrackerDirective"></ap-icon-button>
        </div>
      </mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <div class="ap-flex ap-flex-col ap-gap-3">
        @for (
        property of property.properties | objectToArray; track
        property; let i = $index) {
        <div>
          <ng-container *ngTemplateOutlet="
                  formFieldsTemplate;
                  context: {
                    $implicit: property,
                    propertyIndex: i,
                    formGroup: formControl,
                    prefix: prefix
                  }
                ">
          </ng-container>
        </div>
        }
      </div>
    </mat-card-content>
  </mat-card>
  `,
})
export class ArrayFormControlObjectItemComponent {

  removeItemTooltip = $localize`Remove item`;

  @Input({ required: true }) idx: number;
  @Input({ required: true }) formFieldsTemplate: TemplateRef<unknown>;
  @Input({ required: true }) formControl: FormControl;
  @Input({ required: true }) property: ArrayProperty<true>;
  @Input({ required: true }) prefix: string;
  @Output() removeValue = new EventEmitter<number>();

}
