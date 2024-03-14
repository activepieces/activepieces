import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  InsertMentionOperation,
  UiCommonModule,
} from '@activepieces/ui/common';
import { InterpolatingTextFormControlComponent } from '../interpolating-text-form-control/interpolating-text-form-control.component';
import {
  DateTimeProperty,
  FileProperty,
  LongTextProperty,
  PropertyType,
  ShortTextProperty,
} from '@activepieces/pieces-framework';
import { FormControl } from '@angular/forms';
import { BuilderAutocompleteDropdownHandlerComponent } from '../interpolating-text-form-control/builder-autocomplete-dropdown-handler/builder-autocomplete-dropdown-handler.component';

@Component({
  selector: 'app-text-control',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    BuilderAutocompleteDropdownHandlerComponent,
    InterpolatingTextFormControlComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #interpolatingTextComponentContainer
      (click)="$event.stopImmediatePropagation()"
      apTrackHover
      #textInputContainer="hoverTrackerDirective"
    >
      <mat-form-field
        subscriptSizing="dynamic"
        class="ap-w-full"
        appearance="outline"
        #textInput
        (click)="handler.showMentionsDropdown()"
      >
        @if(property.type === PropertyType.FILE) {
        <div matTooltip="File Input" matSuffix class="material-suffix-icon">
          <svg-icon
            src="assets/img/custom/file.svg"
            [applyClass]="true"
            class="ap-w-[24px] a-h-[24px] ap-fill-description "
          >
          </svg-icon>
        </div>
        } @else if(property.type === PropertyType.DATE_TIME) {
        <div
          matTooltip="Date/Time Input"
          matSuffix
          class="material-suffix-icon"
        >
          <svg-icon
            [applyClass]="true"
            src="assets/img/custom/calendar.svg"
            matToolip
            class="ap-w-[24px] a-h-[24px] ap-fill-description"
          >
          </svg-icon>
        </div>
        }

        <mat-label>{{ property.displayName }}</mat-label>
        <app-interpolating-text-form-control
          #textControl
          [formControl]="passedFormControl"
          [attr.name]="property.displayName"
          (editorFocused)="handler.showMentionsDropdown()"
        ></app-interpolating-text-form-control>
      </mat-form-field>

      <app-builder-autocomplete-dropdown-handler
        #handler
        [container]="interpolatingTextComponentContainer"
        (mentionEmitted)="addMention(textControl, $event)"
      >
      </app-builder-autocomplete-dropdown-handler>
    </div>
  `,
})
export class TextControlComponent {
  @Input({ required: true }) property:
    | LongTextProperty<boolean>
    | ShortTextProperty<boolean>
    | FileProperty<boolean>
    | DateTimeProperty<boolean>;
  @Input({ required: true }) passedFormControl: FormControl<string>;
  readonly PropertyType = PropertyType;
  async addMention(
    textControl: InterpolatingTextFormControlComponent,
    mentionOp: InsertMentionOperation
  ) {
    await textControl.addMention(mentionOp);
  }
}
