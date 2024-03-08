import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'array-form-control-text-item',
  template: `
    <div class="ap-flex ap-gap-1 ap-justify-between ap-items-start">
    <div class="ap-flex-grow" #interpolatingTextControlContainer>
      <mat-form-field apTrackHover #valueInput="hoverTrackerDirective" class="ap-w-[100%]" [subscriptSizing]="'dynamic'">
        <mat-label>Item {{idx + 1}}</mat-label>
        <app-interpolating-text-form-control #textControl [insideMatField]="false"
          [formControl]="formControl" (click)="formControl.enabled ? handler.showMentionsDropdown() : null"></app-interpolating-text-form-control>
        <app-builder-autocomplete-dropdown-handler #handler [container]="interpolatingTextControlContainer"
          (mentionEmitted)="textControl.addMention($event)">
        </app-builder-autocomplete-dropdown-handler>
      </mat-form-field>
    </div>
    <ap-button btnColor="basic" btnStyle="basic" (buttonClicked)="removeValue.emit(idx)" type="button" 
      [matTooltip]="removeItemTooltip"
      btnSize="large">
      X
    </ap-button>
  </div>
  `,
})
export class ArrayFormControlTextItemComponent {

  removeItemTooltip = $localize`Remove item`;

  @Input({ required: true }) idx: number;
  @Input({ required: true }) formControl: FormControl;
  @Output() removeValue = new EventEmitter<number>();

}
