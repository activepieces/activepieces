import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { UUID } from 'angular2-uuid';
import { map, Observable, switchMap } from 'rxjs';
import { BaseOAuth2ConnectionValue, ClaimTokenWithSecretRequest, OAuth2AppDetails } from '@activepieces/shared';

@Injectable({
	providedIn: 'root',
})
export class Oauth2Service {
	private currentlyOpenPopUp: Window | null = null;

	constructor(private httpClient: HttpClient) {}

	public claimWithSecret(request: ClaimTokenWithSecretRequest) {
		return this.httpClient.post<BaseOAuth2ConnectionValue>(environment.apiUrl + '/oauth2/claim', request);
	}

	public openPopup(
		request: OAuth2AppDetails & { scope: string; auth_url: string,  extraParams: Record<string, unknown> }
	): Observable<any> {
		this.currentlyOpenPopUp?.close();
		const winTarget = '_blank';
		const winFeatures =
			'resizable=no, toolbar=no,left=100, top=100, scrollbars=no, menubar=no, status=no, directories=no, location=no, width=600, height=800';
		const redirect_uri = request.redirect_url || environment.redirectUrl;
		let url =
			request.auth_url +
			'?response_type=code' +
			'&client_id=' +
			request.client_id +
			'&redirect_uri=' +
			redirect_uri +
			'&access_type=offline' +
			'&state=' +
			UUID.UUID() +
			'&prompt=consent' +
			'&scope=' +
			request.scope;
		if (request.extraParams) {
			const entries = Object.entries(request.extraParams);
			for (let i = 0; i < entries.length; ++i) {
				url = url + '&' + entries[i][0] + '=' + entries[i][1];
			}
		}
		const popup = window.open(url, winTarget, winFeatures);
		this.currentlyOpenPopUp = popup;
		const codeObs$ = new Observable<any>(observer => {
			window.addEventListener('message', function (event) {
				if (redirect_uri.startsWith(event.origin)) {
					if (event.data != undefined) {
						event.data.code = decodeURIComponent(event.data.code);
						observer.next(event.data);
						popup?.close();
						observer.complete();
					} else {
						observer.error('No code returned');
						popup?.close();
						observer.complete();
					}
				}
			});
		});

		return codeObs$.pipe(
			switchMap(params => {
				if (params != undefined && params.code != undefined) {
					return this.claimWithSecret({
						code: decodeURIComponent(params.code),
						clientId: request.client_id,
						clientSecret: request.client_secret,
						redirectUrl: redirect_uri,
						tokenUrl: request.token_url,
					}).pipe(
						map(value => {
							if (value['error']) {
								throw Error(value['error']);
							}
							return value;
						})
					);
				}

				throw new Error(`params for openPopUp is empty or the code is, params:${params}`);
			})
		);
	}

	private claimWithScretForCloud(request: { pieceName: string; code: string }) {
		return this.httpClient.post<BaseOAuth2ConnectionValue>(environment.apiUrl + '/oauth2/claim-with-cloud', request);
	}
	public openCloudAuthPopup(request: {
		clientId: string;
		authUrl: string;
		extraParams: Record<string, unknown>;
		scope: string;
		pieceName: string;
	}): Observable<any> {
		this.currentlyOpenPopUp?.close();
		const winTarget = '_blank';
		const winFeatures =
			'resizable=no, toolbar=no,left=100, top=100, scrollbars=no, menubar=no, status=no, directories=no, location=no, width=600, height=800';
		const redirect_uri = 'https://secrets.activepieces.com/redirect';
		let url =
			request.authUrl +
			'?response_type=code' +
			'&client_id=' +
			request.clientId +
			'&redirect_uri=' +
			redirect_uri +
			'&access_type=offline' +
			'&state=' +
			UUID.UUID() +
			'&prompt=consent' +
			'&scope=' +
			request.scope;
		if (request.extraParams) {
			const entries = Object.entries(request.extraParams);
			for (let i = 0; i < entries.length; ++i) {
				url = url + '&' + entries[i][0] + '=' + entries[i][1];
			}
		}
		const popup = window.open(url, winTarget, winFeatures);
		this.currentlyOpenPopUp = popup;
		const codeObs$ = new Observable<any>(observer => {
			window.addEventListener('message', function (event) {
				if (redirect_uri.startsWith(event.origin)) {
					if (event.data != undefined) {
						event.data.code = decodeURIComponent(event.data.code);
						observer.next(event.data);
						popup?.close();
						observer.complete();
					} else {
						observer.error('No code returned');
						popup?.close();
						observer.complete();
					}
				}
			});
		});

		return codeObs$.pipe(
			switchMap(params => {
				if (params != undefined && params.code != undefined) {
					return this.claimWithScretForCloud({
						code: decodeURIComponent(params.code),
						pieceName: request.pieceName,
					}).pipe(
						map(value => {
							if (value['error']) {
								throw Error(value['error']);
							}
							return value;
						})
					);
				}

				throw new Error(`params for openPopUp is empty or the code is, params:${params}`);
			})
		);
	}
}
