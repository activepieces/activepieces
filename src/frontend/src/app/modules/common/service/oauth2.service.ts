import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { OAuth2Response } from '../model/fields/variable/subfields/oauth2-response.interface';
import { UUID } from 'angular2-uuid';
import { map, Observable, switchMap } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class Oauth2Service {
	private currentlyOpenPopUp: Window | null = null;

	constructor(private httpClient: HttpClient) {}

	public claimWithSecret(request: { code: string; client_id: string; token_url: string; client_secret: string }) {
		return this.httpClient.post<OAuth2Response>(environment.apiUrl + '/oauth2/claim-with-secret', request);
	}

	public openPopup(request: {
		auth_url: string;
		client_id: string;
		client_secret: string;
		scope: string;
		token_url: string;
		response_type: string;
		redirect_url: string;
	}): Observable<any> {
		this.currentlyOpenPopUp?.close();
		const winTarget = '_blank';
		const winFeatures =
			'resizable=no, toolbar=no,left=100, top=100, scrollbars=no, menubar=no, status=no, directories=no, location=no, width=600, height=800';
		const redirect_uri = request.redirect_url || environment.redirectUrl;
		const url =
			request.auth_url +
			'?response_type=' +
			request.response_type +
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
						client_id: request.client_id,
						client_secret: request.client_secret,
						token_url: request.token_url,
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
