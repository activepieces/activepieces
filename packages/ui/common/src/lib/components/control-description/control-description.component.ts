import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {
  BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM,
  EMPTY_SPACE_BETWEEN_INPUTS_IN_PIECE_PROPERTIES_FORM,
} from '../../utils/consts';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { CheckOverflowDirective } from '../../directives';
@Component({
  selector: 'ap-control-description',
  standalone: true,
  imports: [CommonModule, MarkdownModule, CheckOverflowDirective],
  template: `
    @if( !(description || (passedFormControl.touched &&
    passedFormControl.invalid))) {
    <div [style.height]="MIN_SPACING_BETWEEN_INPUTS"></div>
    } @else() {
    <div
      class="ap-flex ap-justify-between ap-markdown "
      [style.marginBottom]="
        BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM
      "
      *ngIf="
        description || (passedFormControl.touched && passedFormControl.invalid)
      "
    >
      <div
        class="ap-line-clamp-1"
        [style.display]="isExpanded ? 'block' : '-webkit-box'"
        [class.ap-h-[24px]]="!isExpanded"
      >
        <div
          class="ap-typography-caption"
          apCheckOverflow
          (isOverflowed)="isOverFlown = $event"
        >
          <markdown
            [data]="
              passedFormControl.touched && passedFormControl.invalid
                ? errorMessageOpeningTag +
                  errorMessage +
                  errorMessageClosingTag +
                  ' ' +
                  description
                : description
            "
          >
          </markdown>
        </div>
      </div>
      <div class="ap-flex ap-items-start">
        <button
          class="ap-underline ap-typography-caption ap-mt-2"
          *ngIf="isExpanded || isOverFlown"
          (click)="isExpanded = !isExpanded"
        >
          {{ isExpanded ? 'less' : 'more' }}
        </button>
      </div>
    </div>
    }
  `,
})
export class ControlDescriptionComponent {
  readonly BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM =
    BOTTOM_MARGIN_FOR_DESCRIPTION_IN_PIECE_PROPERTIES_FORM;
  readonly MIN_SPACING_BETWEEN_INPUTS =
    EMPTY_SPACE_BETWEEN_INPUTS_IN_PIECE_PROPERTIES_FORM;
  isOverFlown = false;
  isExpanded = false;
  errorMessageOpeningTag = "<span class='ap-text-danger'>";
  errorMessageClosingTag = '</span>';
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) description = '';
  @Input({ required: true }) passedFormControl: AbstractControl;
}
