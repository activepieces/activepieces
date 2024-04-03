import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import Color from 'color';

@Component({
  selector: 'ap-chips-list',
  template: `
<div class="ap-flex ap-gap-2">
  @for (chip of chips; track chip) {
    <div
      class="ap-relative ap-grid ap-items-center ap-px-2 ap-py-1 ap-font-sans ap-text-xs ap-font-bold ap-lowercase ap-rounded-md ap-select-none ap-whitespace-nowrap"
      [style.backgroundColor]="generateRandomColor(chip)"
      [style.color]="generateTextColor(chip)"
      style="border: 0.5px solid {{generateTextColor(chip)}}">
     {{chip}}
    </div>
  }
</div> 
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApChipsListComponent {

  @Input() chips: string[] = [];


  generateRandomColor(chip: string): string {
    const colors = ["rgba(72, 46, 234, 0.15)", "rgba(25, 194, 187, 0.15)", "rgba(216, 151, 224, 0.15)", "rgba(111, 176, 243, 0.15)", "rgba(223, 172, 60, 0.15)", "rgba(40, 49, 167, 0.15)", "rgba(247, 198, 199, 0.15)", "rgba(0, 126, 198, 0.15)", "rgba(191, 218, 220, 0.15)", "rgba(0, 82, 204, 0.15)", "rgba(242, 149, 19, 0.15)", "rgba(3, 102, 214, 0.15)"]
    const seed = [...chip].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[Math.floor(seed % colors.length)];
  }

  private darkenColor(hexColor: string): string {
    return Color(hexColor).darken(0.3).hex();
  }

  generateTextColor(text: string) {
    const randomColor = this.generateRandomColor(text);
    return this.darkenColor(randomColor);
  }


}
