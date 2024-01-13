import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[apCard]',
})
export class CardDirective implements OnInit {
  constructor(private eRef: ElementRef<HTMLElement>) {}
  ngOnInit() {
    this.eRef.nativeElement.classList.add(
      'ap-rounded',
      'ap-border',
      'ap-border-solid',
      'ap-border-border',
      'ap-p-4',
      'ap-shadow'
    );
  }
}
