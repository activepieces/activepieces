import { Component, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, debounceTime, exhaustMap, map, tap } from 'rxjs';
import { PieceMetadataService } from '@activepieces/ui/common';
import { AppConnectionWithoutSensitiveData } from '@activepieces/shared';
import { ChatBotService } from '../chatbot.service';
import deepEqual from 'deep-equal';
import { PieceMetadata } from '@activepieces/pieces-framework';
import { Store } from '@ngrx/store';
import {
  BuilderSelectors,
  ConnectionDropdownItem,
  appConnectionsActions,
} from '@activepieces/ui/feature-builder-store';
import { MatSelect } from '@angular/material/select';
import {
  Chatbot,
  DataSource,
  UpdateChatbotRequest,
  VisibilityStatus,
} from '@activepieces/shared';

@Component({
  selector: 'app-chatbot-settings',
  styleUrls: ['./chatbot-settings.component.scss'],
  templateUrl: './chatbot-settings.component.html',
})
export class ChatbotSettingsComponent {
  @ViewChild('connectionsDropdown') connectionsDropdown: MatSelect | undefined;
  formGroup: FormGroup<{
    displayName: FormControl<string>;
    prompt: FormControl<string>;
    connectionId: FormControl<string>;
    dataSources: FormControl<DataSource[]>;
    isPublic: FormControl<boolean>;
  }>;
  saveConnection$: Observable<void>;
  promptChanged$: Observable<string>;
  displayNameChanged$: Observable<string>;
  publicChanged$: Observable<boolean>;
  connectionsDropdownList$: Observable<ConnectionDropdownItem[]>;
  connections$: Observable<AppConnectionWithoutSensitiveData[]>;
  chatbotId = '';
  save$: Subject<{
    displayName?: string;
    prompt?: string;
    connectionId?: string;
    visibilityStatus?: VisibilityStatus;
  }> = new Subject();
  lastSaveRequest:
    | {
        displayName?: string;
        prompt?: string;
        connectionId?: string;
      }
    | undefined;
  saveListener$: Observable<{
    displayName?: string;
    prompt?: string;
    connectionId?: string;
    visibilityStatus?: VisibilityStatus;
  }>;
  readonly pieceName = '@activepieces/piece-openai';
  readonly pieceVersion = '0.3.0';
  readonly openAiPiece$: Observable<PieceMetadata>;
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
    private actRoute: ActivatedRoute,
    private router: Router
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
        validators: [],
        nonNullable: true,
      }),
      connectionId: new FormControl('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      dataSources: new FormControl<DataSource[]>([], {
        validators: [],
        nonNullable: true,
      }),
      isPublic: new FormControl<boolean>(false, { nonNullable: true }),
    });
    this.saveConnection$ =
      this.formGroup.controls.connectionId.valueChanges.pipe(
        tap((connectionId) => {
          if (connectionId) this.save$.next({ connectionId });
        }),
        map(() => void 0)
      );
    this.publicChanged$ = this.formGroup.controls.isPublic.valueChanges.pipe(
      tap((val) => {
        this.save$.next({
          visibilityStatus: val
            ? VisibilityStatus.PUBLIC
            : VisibilityStatus.PRIVATE,
        });
      })
    );
    this.loadConnections$ = this.actRoute.data.pipe(
      tap((value) => {
        const routeData = value as {
          connections: AppConnectionWithoutSensitiveData[];
          chatbot: Chatbot;
        };
        this.formGroup.patchValue(routeData.chatbot);
        this.formGroup.controls.isPublic.setValue(
          routeData.chatbot.visibilityStatus === VisibilityStatus.PUBLIC
        );
        this.chatbotId = routeData.chatbot.id;
        this.store.dispatch(
          appConnectionsActions.loadInitial({
            connections: routeData.connections,
          })
        );
      }),
      map(() => void 0)
    );
    this.promptChanged$ = this.formGroup.controls.prompt.valueChanges.pipe(
      debounceTime(100),
      tap((prompt) => {
        this.save$.next({ prompt });
      })
    );

    this.displayNameChanged$ =
      this.formGroup.controls.displayName.valueChanges.pipe(
        debounceTime(100),
        tap((displayName) => {
          if (displayName) {
            this.save$.next({ displayName });
          }
        })
      );
    this.connections$ = this.store.select(
      BuilderSelectors.selectAllAppConnections
    );
    this.connectionsDropdownList$ = this.store.select(
      BuilderSelectors.selectAppConnectionsDropdownOptionsForAppWithIds(
        '@activepieces/piece-openai'
      )
    );
    this.saveListener$ = this.save$.pipe(
      tap((val) => {
        this.lastSaveRequest = val;
      }),
      exhaustMap((val) => {
        return this.save(val).pipe(map(() => val));
      }),
      tap((val) => {
        if (
          !deepEqual(val, this.lastSaveRequest) &&
          this.lastSaveRequest !== undefined
        ) {
          this.save$.next(this.lastSaveRequest);
        }
        this.lastSaveRequest = undefined;
      })
    );
  }
  connectionValueChanged(event: { value: string }) {
    this.formGroup.controls.connectionId.setValue(event.value);
  }

  save(req: {
    connectionId?: string;
    prompt?: string;
    displayName?: string;
    visibilityStatus?: VisibilityStatus;
  }) {
    this.saving = true;
    const request: UpdateChatbotRequest = {
      displayName: req.displayName || this.formGroup.controls.displayName.value,
      prompt: req.prompt || this.formGroup.controls.prompt.value,
      connectionId:
        req.connectionId || this.formGroup.controls.connectionId.value,
      visibilityStatus:
        req.visibilityStatus === undefined
          ? this.formGroup.controls.isPublic.value
            ? VisibilityStatus.PUBLIC
            : VisibilityStatus.PRIVATE
          : req.visibilityStatus,
    };
    return this.chatbotService.update(this.chatbotId, request).pipe(
      tap(() => {
        this.saving = false;
      })
    );
  }
  redirectHome(newWindow: boolean) {
    if (newWindow) {
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`/chatbots`])
      );
      window.open(url, '_blank', 'noopener');
    } else {
      this.router.navigate(['/chatbots']);
    }
  }
  openChatbot() {
    window.open(`/chatbots/${this.chatbotId}`, '_blank', 'noopener');
  }

  chatWIthBotTooltipText() {
      return !this.formGroup.controls.connectionId.value ? $localize`Please choose a connection first` : ''
  }
}
