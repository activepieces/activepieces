import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  InsertMentionOperation,
  UiCommonModule,
} from '@activepieces/ui/common';
import { CodeService } from '@activepieces/ui/feature-builder-store';
import { FormControl } from '@angular/forms';
import { JsonProperty } from '@activepieces/pieces-framework';
import { BuilderAutocompleteDropdownHandlerComponent } from '../interpolating-text-form-control/builder-autocomplete-dropdown-handler/builder-autocomplete-dropdown-handler.component';
import { IsJsonControllerDisabledPipe } from '../../pipes/is-json-control-disabled.pipe';

@Component({
  selector: 'app-json-control',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    BuilderAutocompleteDropdownHandlerComponent,
    IsJsonControllerDisabledPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #interpolatingTextControlContainer
      #hoverContainer="hoverTrackerDirective"
      apTrackHover
      (click)="$event.stopImmediatePropagation()"
    >
      <div class="ap-rounded-lg ap-border ap-border-solid ap-border-dividers">
        <div
          class="ap-px-4 ap-py-3 ap-items-center ap-justify-between ap-flex ap-border-solid ap-border-b ap-border-dividers"
        >
          {{ property.displayName }}
          <svg-icon
            src="/assets/img/custom/beautify.svg"
            [svgStyle]="{ width: '16px', height: '16px' }"
            (click)="beautify()"
            matTooltip="beautify"
            class="ap-cursor-pointer"
          >
          </svg-icon>
        </div>

        <div class="ap-h-[300px]">
          <ngx-monaco-editor
            (onInit)="onInit($event)"
            class="!ap-h-full !ap-w-full"
            (click)="handler.showMentionsDropdown()"
            [options]="passedFormControl | isJsonControlDisabled"
            [formControl]="passedFormControl"
          ></ngx-monaco-editor>
        </div>
      </div>

      <app-builder-autocomplete-dropdown-handler
        #handler
        [container]="interpolatingTextControlContainer"
        (mentionEmitted)="addMentionToJsonControl($event)"
      >
      </app-builder-autocomplete-dropdown-handler>
    </div>
  `,
})
export class JsonControlComponent {
  @Input({ required: true }) passedFormControl: FormControl<string>;
  @Input({ required: true }) property: JsonProperty<boolean>;
  jsonMonacoEditor: any;
  constructor(private codeService: CodeService) {}

  beautify() {
    try {
      this.passedFormControl.setValue(
        this.codeService.beautifyJson(JSON.parse(this.passedFormControl.value)),
        { emitEvent: false }
      );
    } catch {
      //ignore
    }
  }

  addMentionToJsonControl(mention: InsertMentionOperation) {
    this.jsonMonacoEditor.trigger('keyboard', 'type', {
      text: mention.insert.apMention.serverValue,
    });
  }
  onInit(monacoEditor: any) {
    this.jsonMonacoEditor = monacoEditor;
  }
}
