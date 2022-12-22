import type {Component} from '../framework/component';
import { gmail } from './gmail';
import { facebook } from './facebook';
import {slack} from "./slack";

export const components: Component[] = [
	slack,
	gmail,
	facebook
];

export const getComponent = (name: string): Component | undefined => {
	return components.find(f => name.toLowerCase() === f.name.toLowerCase());
}