import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import {
  parametersValidator,
  clearLocalStorageFromOurKeys,
  storeLocal,
  StorageName,
  getLocal,
} from './helper/helper';
import { lastValueFrom, tap, map, of, Observable } from 'rxjs';
import { SubSink } from 'subsink';
import { setStylesForSdkElement } from './helper/colors';
import { AppConnection, ProjectId } from '@activepieces/shared';
import { AppCredential } from '@activepieces/ee-shared';
import { ModalCommunicationService } from './service/modal-communication.service';
import { CredentialService } from './service/credential.service';
import { ConnectionService } from './service/connection.service';
import { SdkEvent } from './helper/event.enum';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class AppComponent implements OnDestroy, AfterViewInit {
  subSink = new SubSink();

  constructor(
    private ngZone: NgZone,
    private elementRef: ElementRef,
    private connectionService: ConnectionService,
    private credentialService: CredentialService,
    private modalCommunincationService: ModalCommunicationService
  ) {}

  //SDK function
  @Input() init = ({ token, styles, host, projectId }: InitParams) => {
    parametersValidator(
      { token, styles, host, projectId },
      Object.keys(initParamsValidationObject)
    );
    clearLocalStorageFromOurKeys();
    storeLocal(StorageName.HOST, host);
    storeLocal(StorageName.TOKEN, token);
    storeLocal(StorageName.PROJECT_ID, projectId);
    if (styles) {
      styles = {
        primaryColor: styles.primaryColor ? styles.primaryColor : '#6e41e2',
      };
      storeLocal(StorageName.STYLES, styles);
    } else {
      storeLocal(StorageName.STYLES, { primaryColor: '#6e41e2' });
    }
    if (!(window as any).activepieces) (window as any).activepieces = {};
    (window as any).activepieces.initialised = true;
    if (this.elementRef) {
      setStylesForSdkElement(this.elementRef);
    }
    return lastValueFrom(of('initialized'));
  };

  //SDK function
  @Input()
  public getConnection = ({ appName }: connectedParam) => {
    parametersValidator(
      { appName },
      Object.keys(connectedParamValidationObject)
    );
    this.checkAuthRequest();
    const projectId = getLocal(StorageName.PROJECT_ID);
    const token = getLocal(StorageName.TOKEN);
    const cred$ = this.connectionService.get({
      projectId,
      appName,
      token: token,
    });
    return lastValueFrom(cred$);
  };

  //SDK function
  @Input()
  public isConnected = ({ appName }: connectedParam) => {
    parametersValidator(
      { appName },
      Object.keys(connectedParamValidationObject)
    );
    this.checkAuthRequest();
    const projectId = getLocal(StorageName.PROJECT_ID);
    const token = getLocal(StorageName.TOKEN);
    const cred$ = this.connectionService
      .get({ projectId, appName, token: token })
      .pipe(
        map((cred: any) => {
          return cred !== null;
        })
      );
    return lastValueFrom(cred$);
  };

  //SDK function
  @Input()
  public on = ({ eventName, callback }: SubscribeParams) => {
    parametersValidator(
      { eventName: eventName, callback: callback },
      Object.keys(SubscribeParamsValidationObject)
    );
    const subject = this.getEventSubject(eventName);
    // eslint-disable-next-line rxjs-angular/prefer-async-pipe
    const subscription = subject.subscribe((val: any) => {
      callback(val);
    });
    this.subSink.add(subscription);
    return lastValueFrom(of('Added to the listener'));
  };

  //SDK function
  @Input()
  public connect = ({ appName }: configureIntegrationParams) => {
    parametersValidator(
      { appName },
      Object.keys(configureIntegrationParamsValidationObject)
    );
    this.checkAuthRequest();
    const projectId = getLocal(StorageName.PROJECT_ID);
    const cred$ = this.credentialService.byName(projectId, appName).pipe(
      tap((cred: AppCredential | undefined) => {
        if (cred === undefined) {
          throw new Error('Invalid appName ' + appName);
        }
        this.ngZone.run(() => {
          this.modalCommunincationService.openEnableIntegrationModal(cred);
        });
      }),
      map(() => 'Modal Opened')
    );
    return lastValueFrom(cred$);
  };

  //SDK function
  @Input()
  public disconnect = ({ appName }: configureIntegrationParams) => {
    parametersValidator(
      { appName },
      Object.keys(configureIntegrationParamsValidationObject)
    );
    this.checkAuthRequest();
    const projectId = getLocal(StorageName.PROJECT_ID);
    const token = getLocal(StorageName.TOKEN);
    const cred$ = this.connectionService
      .get({ projectId, appName, token })
      .pipe(
        tap((connection: AppConnection | null) => {
          console.log(connection);
          if (connection === null) {
            throw new Error('There is no connection for ' + appName);
          }
          this.ngZone.run(() => {
            this.modalCommunincationService.openDisableIntegrationModal(
              connection
            );
          });
        }),
        map(() => 'Modal Opened')
      );
    return lastValueFrom(cred$);
  };

  ngAfterViewInit(): void {
    setStylesForSdkElement(this.elementRef);
  }

  ngOnDestroy(): void {
    this.subSink.unsubscribe();
  }

  checkAuthRequest() {
    if (getLocal(StorageName.TOKEN) === null) {
      throw new Error(
        'Activepieces-please make sure you have called ap.init({token,projectId,host})'
      );
    }
  }

  getEventSubject(eventName: string): Observable<any> {
    switch (eventName) {
      case SdkEvent.CONNECTION: {
        return this.modalCommunincationService.connectionSubject;
      }
      case SdkEvent.DISCONNECTION: {
        return this.modalCommunincationService.disconnectionSubject;
      }
    }
    throw new Error('Activepieces-Event name passed is invalid');
  }
}

export interface SubscribeParams {
  eventName: SdkEvent;
  // eslint-disable-next-line @typescript-eslint/ban-types
  callback: Function;
}

const SubscribeParamsValidationObject: SubscribeParams = {
  eventName: SdkEvent.CONNECTION,
  callback: () => {
    // Empty function
  },
};

export interface InitParams {
  token: string;
  projectId: ProjectId;
  host: string;
  styles?: {
    primaryColor: string;
  };
}

const initParamsValidationObject: InitParams = {
  token: 'token',
  projectId: 'projectId',
  host: 'host',
};

export interface connectedParam {
  appName: string;
}

export const connectedParamValidationObject: connectedParam = { appName: '' };

export interface configureIntegrationParams {
  appName: string;
}

export const configureIntegrationParamsValidationObject: configureIntegrationParams =
  { appName: '' };
