// also exported from '@storybook/angular' if you can deal with breaking changes in 6.1
import { ApButtonComponent } from '../app/layout/common-layout/components/ap-button/ap-button.component';
import { moduleMetadata, Meta, StoryObj } from '@storybook/angular';

import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// More on default export: https://storybook.js.org/docs/angular/writing-stories/introduction#default-export
type StoryType = ApButtonComponent & { label?: string };
export default {
	title: 'Example/Button',
	component: ApButtonComponent,
	decorators: [
		moduleMetadata({
			imports: [MatButtonModule, MatTooltipModule, BrowserAnimationsModule],
		}),
	],
	render: args => {
		const { label, ...props } = args;
		return {
			props,
			template: `<link
      href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,300"
      rel="stylesheet"
      type="text/css"
    />
    <div class="d-flex">
    <app-button [tooltipText]="tooltipText" [tooltipDisabled]="tooltipDisabled" [loadingCSS]="loadingCSS" [btnStyle]="btnStyle" [btnColor]="btnColor" [disabled]="disabled" [fullWidthOfContainer]="fullWidthOfContainer" [loading]="loading" [btnSize]="btnSize">${label}</app-button>
    </div>
    `,
		};
	},
} as Meta<StoryType>;

// More on component templates: https://storybook.js.org/docs/angular/writing-stories/introduction#using-args

export const Default: StoryObj<StoryType> = {
	args: {
		label: 'test',
	},
	parameters: { controls: { exclude: ['btnClassesMap', 'btnSizeClass'] } },
};
