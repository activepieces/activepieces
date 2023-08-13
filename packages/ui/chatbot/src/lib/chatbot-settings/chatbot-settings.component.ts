import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, debounceTime, map, skip, switchMap, tap } from 'rxjs';
import { ChatBotService } from '../chatbot.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AppConnectionsService,
  GenericSnackbarTemplateComponent
} from '@activepieces/ui/common';
import { AppConnection } from '@activepieces/shared';

@Component({
  selector: 'activepieces-chatbot-settings',
  templateUrl: './chatbot-settings.component.html',
  styleUrls: []
})
export class ChatbotSettingsComponent implements OnInit {
  formGroup: FormGroup = new FormGroup({});
  updateExistingDate$: Observable<void> | undefined;
  autoSave$: Observable<void> | undefined;
  connections$: Observable<AppConnection[]> | undefined;
  chatbotId = '';
  constructor(
    private activatedRouter: ActivatedRoute,
    private formBuilder: FormBuilder,
    private chatbotService: ChatBotService,
    private connectionService: AppConnectionsService,
    private matSnackBar: MatSnackBar
  ) {}
  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      displayName: new FormControl('', { validators: [Validators.required] }),
      prompt: new FormControl('', { validators: [Validators.required] })
    });
    this.chatbotId = this.activatedRouter.snapshot.params['id'];
    this.updateExistingDate$ = this.chatbotService.get(this.chatbotId).pipe(
      tap((value) => {
        this.formGroup.controls['displayName'].setValue(value.displayName);
        this.formGroup.controls['prompt'].setValue(value.settings.prompt);
      }),
      map(() => {})
    );

    this.connections$ = this.connectionService
      .list({
        appName: '@activepieces/piece-openai',
        limit: 100
      })
      .pipe(
        map((value) => {
          return value.data;
        })
      );
    this.autoSave$ = this.formGroup.valueChanges.pipe(
      debounceTime(500),
      switchMap((value) => {
        return this.chatbotService.update(this.chatbotId, {
          displayName: value.displayName,
          settings: {
            prompt: value.prompt
          }
        });
      }),
      skip(1),
      tap(() => {
        this.matSnackBar.openFromComponent(GenericSnackbarTemplateComponent, {
          data: 'Chatbot settings updated successfully',
          duration: 2000
        });
      }),
      map(() => {})
    );
  }

  createConnection(){
    
  }
}
