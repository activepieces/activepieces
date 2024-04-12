import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ap-chips-list',
  template: `
    <div class="ap-flex ap-gap-2">
      @for (chip of sortedChips; track chip) {
      <span
        class="ap-bg-gray-100 ap-text-gray-500 ap-text-sm ap-font-semibold ap-me-2 ap-px-2.5 ap-py-0.5 ap-rounded"
        >{{ chip }}</span
      >
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApChipsListComponent {
  @Input() chips: string[] = [];

  get sortedChips(): string[] {
    return this.chips.sort();
  }
}
