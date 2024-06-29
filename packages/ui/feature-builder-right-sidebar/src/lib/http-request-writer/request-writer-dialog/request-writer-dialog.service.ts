import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeneratedCodeService {
  private generatedCodeSubject = new BehaviorSubject<string | null>(null);

  getGeneratedCode$(): Observable<string | null> {
    return this.generatedCodeSubject.asObservable();
  }

  setGeneratedCode(code: string): void {
    this.generatedCodeSubject.next(code);
  }
}
