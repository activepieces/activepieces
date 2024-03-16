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

@Component({
  selector: 'app-json-control',
  standalone: true,
  imports: [
    CommonModule,
    UiCommonModule,
    BuilderAutocompleteDropdownHandlerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #jsonInputTemplate>
      <div
        #interpolatingTextControlContainer
        #hoverContainer="hoverTrackerDirective"
        apTrackHover
        (click)="$event.stopImmediatePropagation()"
      >
        <div class="ap-py-2 ap-px-4 ap-flex bar-containing-beautify-button">
          <div class="ap-flex-grow">
            <span class="ap-text-white ap-flex ap-gap-2 ap-items-center">
              {{ property.displayName }}
            </span>
          </div>
          <div>
            <svg-icon
              src="/assets/img/custom/beautify.svg"
              [svgStyle]="{ width: '16px', height: '16px' }"
              (click)="beautify()"
              matTooltip="beautify"
              class="ap-cursor-pointer"
            >
            </svg-icon>
          </div>
        </div>
        <div class="ap-h-[300px]">
          <ngx-monaco-editor
            (onInit)="onInit($event)"
            class="!ap-h-full !ap-w-full"
            [formControl]="passedFormControl"
            (click)="handler.showMentionsDropdown()"
            [options]="codeEditorOptions"
          ></ngx-monaco-editor>
        </div>

        <app-builder-autocomplete-dropdown-handler
          #handler
          [container]="interpolatingTextControlContainer"
          (mentionEmitted)="addMentionToJsonControl($event)"
        >
        </app-builder-autocomplete-dropdown-handler>
      </div>
    </ng-template>
  `,
})
export class JsonControlComponent {
  @Input() passedFormControl: FormControl<string>;
  @Input() property: JsonProperty<boolean>;
  jsonMonacoEditor: any;
  codeEditorOptions = {
    minimap: { enabled: false },
    theme: 'cobalt2',
    language: 'json',
    readOnly: false,
    automaticLayout: true,
    contextmenu: false,
    formatOnPaste: false,
    formatOnType: false,
  };
  constructor(private codeService: CodeService) {}
  beautify() {
    try {
      this.passedFormControl.setValue(
        this.codeService.beautifyJson(JSON.parse(this.passedFormControl.value))
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
