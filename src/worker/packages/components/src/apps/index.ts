import {slack} from './slack';
import type {Component} from '../framework/component';
import { gmail } from './gmail';

export const apps: Component[] = [
	slack,
	gmail
];
