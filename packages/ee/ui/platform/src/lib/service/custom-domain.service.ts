import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@activepieces/ui/common';
import { AddDomainRequest, CustomDomain } from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

@Injectable({
  providedIn: 'root',
})
export class CustomDomainService {
  constructor(private http: HttpClient) {}
  list() {
    return this.http.get<SeekPage<CustomDomain>>(
      environment.apiUrl + '/custom-domains'
    );
  }
  delete(keyId: string) {
    return this.http.delete<void>(
      environment.apiUrl + `/custom-domains/${keyId}`
    );
  }
  create(request: AddDomainRequest) {
    return this.http.post<{
      customDomain: CustomDomain;
      cloudflareHostnameData: null | {
        txtName: string;
        txtValue: string;
      };
    }>(environment.apiUrl + `/custom-domains/`, request);
  }
  verifyDomain(keyId: string) {
    return this.http.patch<{ status: string }>(
      environment.apiUrl + `/custom-domains/verify/${keyId}`,
      {}
    );
  }
  validationData(keyId: string) {
    return this.http.get<{
      txtName: string;
      txtValue: string;
    }>(environment.apiUrl + `/custom-domains/validation/${keyId}`);
  }
}
