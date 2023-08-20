import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { PieceMetadataService } from '@activepieces/ui/common';
import { AppConnection } from '@activepieces/shared';
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
  styleUrls: [],
})
export class ChatbotSettingsComponent implements OnInit {
  formGroup: FormGroup<{
    displayName: FormControl<string>;
    prompt: FormControl<string>;
    connection: FormControl<string>;
  }>;
  updateExistingDate$: Observable<void> | undefined;
  autoSave$: Observable<void> | undefined;
  connections$: Observable<ConnectionDropdownItem[]>;
  chatbotId = '';
  readonly pieceName = '@activepieces/piece-openai';
  readonly pieceVersion = '0.3.0';
  readonly openAiPiece$: Observable<PieceMetadata>;
  loadConnections$: Observable<void>;
  dropdownCompareWithFunction = (opt: string, formControlValue: string) => {
    return formControlValue !== undefined && deepEqual(opt, formControlValue);
  };
  constructor(
    private activatedRouter: ActivatedRoute,
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
      connection: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
    });
    this.loadConnections$ = this.actRoute.data.pipe(
      tap((value) => {
        const routeData = value as { connections: AppConnection[] };
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
  ngOnInit(): void {
    this.chatbotId = this.activatedRouter.snapshot.params['id'];
    this.updateExistingDate$ = this.chatbotService.get(this.chatbotId).pipe(
      tap((value) => {
        this.formGroup.controls['displayName'].setValue(value.displayName);
        this.formGroup.controls['prompt'].setValue(value.settings.prompt);
      }),
      map(() => void 0)
    );

    // this.autoSave$ = this.formGroup.valueChanges.pipe(
    //   debounceTime(500),
    //   switchMap((value) => {
    //     return this.chatbotService.update(this.chatbotId, {
    //       displayName: value.displayName,
    //       settings: {
    //         prompt: value.prompt
    //       }
    //     });
    //   }),
    //   skip(1),
    //   tap(() => {
    //     this.matSnackBar.openFromComponent(GenericSnackbarTemplateComponent, {
    //       data: 'Chatbot settings updated successfully',
    //       duration: 2000
    //     });
    //   }),
    //   map(() => {})
    // );
  }
  connectionValueChanged(event: {
    propertyKey: string;
    value: `{{connections.${string}}}`;
  }) {
    this.formGroup.controls.connection.setValue(event.value.toString());
  }
}
