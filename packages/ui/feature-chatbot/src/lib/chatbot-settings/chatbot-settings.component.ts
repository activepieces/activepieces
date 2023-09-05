import { Component } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { PieceMetadataService, fadeInUp400ms } from '@activepieces/ui/common';
import {
  AppConnectionWithoutSensitiveData,
  Chatbot,
  DataSource,
} from '@activepieces/shared';
import { ChatBotService } from '../chatbot.service';
import deepEqual from 'deep-equal';
import { PieceMetadata } from '@activepieces/pieces-framework';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  ConnectionDropdownItem,
  appConnectionsActions,
} from '@activepieces/ui/feature-builder-store';

@Component({
  selector: 'app-chatbot-settings',
  templateUrl: './chatbot-settings.component.html',
  animations: [fadeInUp400ms],
})
export class ChatbotSettingsComponent {
  formGroup: FormGroup<{
    displayName: FormControl<string>;
    prompt: FormControl<string>;
    connectionId: FormControl<string>;
    sources: FormControl<DataSource[]>;
  }>;
  autoSave$: Observable<void> | undefined;
  connections$: Observable<ConnectionDropdownItem[]>;
  chatbotId = '';
  readonly pieceName = '@activepieces/piece-openai';
  readonly pieceVersion = '0.3.0';
  readonly openAiPiece$: Observable<PieceMetadata>;
  updateSettings$: Observable<Chatbot> | undefined;
  loadConnections$: Observable<void>;
  dropdownCompareWithFunction = (opt: string, formControlValue: string) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };
  saving = false;
  constructor(
    private formBuilder: FormBuilder,
    private chatbotService: ChatBotService,
    private pieceMetadaService: PieceMetadataService,
    private store: Store,
    private actRoute: ActivatedRoute
  ) {
    this.openAiPiece$ = this.pieceMetadaService.getPieceMetadata(
      this.pieceName,
      this.pieceVersion
    );
    this.formGroup = this.formBuilder.group({
      displayName: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      prompt: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      connectionId: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      sources: new FormControl<DataSource[]>([], {
        validators: [],
        nonNullable: true,
      }),
    });
    this.loadConnections$ = this.actRoute.data.pipe(
      tap((value) => {
        const routeData = value as {
          connections: AppConnectionWithoutSensitiveData[];
          chatbot: Chatbot;
        };
        this.formGroup.controls.connectionId.setValue(routeData.chatbot.connectionId);
        this.formGroup.controls.prompt.setValue(
          routeData.chatbot.settings.prompt
        );
        this.formGroup.controls.displayName.setValue(
          routeData.chatbot.displayName
        );
        this.formGroup.controls.sources.setValue(routeData.chatbot.dataSources);
        this.chatbotId = routeData.chatbot.id;
        this.store.dispatch(
          appConnectionsActions.loadInitial({
            connections: routeData.connections,
          })
        );
      }),
      map(() => void 0)
    );

    this.connections$ = this.store.select(
      BuilderSelectors.selectAppConnectionsDropdownOptions
    );
  }
  connectionValueChanged(event: {
    propertyKey: string;
    value: `{{connections['${string}']}}`;
  }) {
    this.formGroup.controls.connectionId.setValue(event.value);
  }
  submit() {
    if (this.formGroup.valid && !this.saving) {
      this.saving = true;
      this.updateSettings$ = this.chatbotService
        .update(this.chatbotId, {
          displayName: this.formGroup.controls['displayName'].value,
          settings: {
            prompt: this.formGroup.controls['prompt'].value,
            auth: this.formGroup.controls['connectionId'].value,
          },
        })
        .pipe(
          tap(() => {
            this.saving = false;
          })
        );
    }
    this.formGroup.markAllAsTouched();
  }
}
