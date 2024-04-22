import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-array-form-control-text-item',
  template: `
    <div class="ap-flex ap-gap-1 ap-justify-between ap-items-center" cdkDrag>
      <mat-icon matTooltip="Drag to move" cdkDragHandle
        >drag_indicator</mat-icon
      >
      <div class="ap-flex-grow" #interpolatingTextControlContainer>
        <mat-form-field
          apTrackHover
          #valueInput="hoverTrackerDirective"
          class="ap-w-[100%]"
          [subscriptSizing]="'dynamic'"
        >
          <mat-label>Item {{ idx + 1 }}</mat-label>
          <app-interpolating-text-form-control
            #textControl
            [stepMetaDataForMentions]="[]"
            [insideMatField]="false"
            [formControl]="formControl"
            (click)="
              formControl.enabled ? handler.showMentionsDropdown() : null
            "
          ></app-interpolating-text-form-control>
          <app-builder-autocomplete-dropdown-handler
            #handler
            [container]="interpolatingTextControlContainer"
            (mentionEmitted)="textControl.addMention($event)"
          >
          </app-builder-autocomplete-dropdown-handler>
        </mat-form-field>
      </div>
      <div
        class="ap-flex ap-items-center ap-pl-2"
        (click)="removeValue.emit(idx)"
      >
        <svg-icon
          src="assets/img/custom/close.svg"
          class="ap-w-[15px] ap-h-[15px] ap-cursor-pointer"
          [applyClass]="true"
          [matTooltip]="removeItemTooltip"
        >
        </svg-icon>
      </div>
    </div>
  `,
})
export class ArrayFormControlTextItemComponent {
  removeItemTooltip = $localize`Remove item`;

  @Input({ required: true }) idx: number;
  @Input({ required: true }) formControl: FormControl;
  @Output() removeValue = new EventEmitter<number>();
}
