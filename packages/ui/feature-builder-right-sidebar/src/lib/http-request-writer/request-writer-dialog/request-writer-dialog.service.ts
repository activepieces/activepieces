import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeneratedCodeService {
  private generatedCodeSource = new BehaviorSubject<string | undefined>(
    undefined
  );
  generatedCode$ = this.generatedCodeSource.asObservable();

  setGeneratedCode(code: string | undefined) {
    this.generatedCodeSource.next(code);
  }
}
