import {slack} from './slack';
import type {Component} from '../framework/component';
import {facebook} from "./facebook";

export const apps: Component[] = [
	slack,
	facebook
];
