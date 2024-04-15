import { ElementRef } from '@angular/core';
import ShadeGenerator from 'node_modules/shade-generator';
import { Shade } from 'node_modules/shade-generator';
import { getLocal, StorageName } from './helper';
const config: Record<Shade, number> = {
  '10': 0.9,
  '20': 0.8,
  '30': 0.7,
  '40': 0.6,
  '50': 0.5,
  '60': 0.4,
  '70': 0.3,
  '80': 0.2,
  '90': 0.1,
  '100': 0,
  '200': 0.9,
  '300': 0.8,
  '400': 0.7,
  '500': 0.6,
  '600': 0.5,
  '700': 0.4,
  '800': 0.3,
  '900': 0.2,
  '1000': 0.1,
};

const boxShadowShade = '20';
const focusedInputBorderShade = '40';
const primaryColorShade = '100';
function getBoxShadeColor(primaryColor: string) {
  return ShadeGenerator.hue(primaryColor)
    .config(config)
    .shade(boxShadowShade)
    .hex();
}

function getPrimaryColorFromShade(primaryColor: string) {
  return ShadeGenerator.hue(primaryColor)
    .config(config)
    .shade(primaryColorShade)
    .hex();
}

function getFocusedInputBorderColorFromShade(primaryColor: string) {
  return ShadeGenerator.hue(primaryColor)
    .config(config)
    .shade(focusedInputBorderShade)
    .hex();
}

function getPrimaryColor() {
  return getLocal(StorageName.STYLES).primaryColor;
}

export function setStylesForSdkElement(elementRef: ElementRef) {
  elementRef.nativeElement.style.setProperty(
    '--primary-color',
    getPrimaryColorFromShade(getPrimaryColor())
  );
  elementRef.nativeElement.style.setProperty(
    '--primary-color-shadow',
    getBoxShadeColor(getPrimaryColor())
  );
  elementRef.nativeElement.style.setProperty(
    '--primary-color-shadow',
    getBoxShadeColor(getPrimaryColor())
  );
  elementRef.nativeElement.style.setProperty(
    '--form-control-focus-border-color',
    getFocusedInputBorderColorFromShade(getPrimaryColor())
  );
}

export function setStylesForCardElement(elementRef: ElementRef) {
  elementRef.nativeElement.style.setProperty(
    '--card-settings-color',
    getPrimaryColorFromShade(getPrimaryColor())
  );
  elementRef.nativeElement.style.setProperty(
    '--card-btn-bg',
    getPrimaryColorFromShade(getPrimaryColor())
  );
  elementRef.nativeElement.style.setProperty('--card-btn-text', '#ffffff');
  elementRef.nativeElement.style.setProperty(
    '--card-btn-shadow',
    getBoxShadeColor(getPrimaryColor())
  );
}
