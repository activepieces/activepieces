import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCommonModule } from '@activepieces/ui/common';

@Component({
  selector: 'app-form-control-hint',
  standalone: true,
  imports: [CommonModule, UiCommonModule],
  template: `
    <div class=" ap-flex ap-gap-2 ap-justify-between ap-markdown ap-mb-[18px]">
      <div
        class="ap-line-clamp-1"
        [style.display]="descriptionExpanded ? 'block' : '-webkit-box'"
        [class.ap-h-[24px]]="!descriptionExpanded"
      >
        <div
          class="ap-typography-caption"
          apCheckOverflow
          (isOverflowed)="descriptionOverflows = $event"
        >
          <markdown i18n>{{ hint }}</markdown>
        </div>
      </div>
      @if (descriptionOverflows || descriptionExpanded) {
      <div class="ap-flex  ap-items-start">
        <button
          class="ap-underline ap-typography-caption ap-mt-2"
          (click)="descriptionExpanded = !descriptionExpanded"
        >
          {{ descriptionExpanded ? 'less' : 'more' }}
        </button>
      </div>
      }
    </div>
  `,
})
export class FormControlHintComponent {
  descriptionExpanded = false;
  descriptionOverflows = false;
  @Input({ required: true }) hint: string;
}
