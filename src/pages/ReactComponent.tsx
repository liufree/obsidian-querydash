import {App, MarkdownRenderChild} from 'obsidian';
import * as React from 'react';
import {createRoot, Root} from "react-dom/client";
import QueryDashView from "./QueryDashView";

export  default class ReactComponent extends MarkdownRenderChild {
	root: Root;
	container: HTMLElement;

	constructor(container: HTMLElement, private source: string, private app: App) {
        super(container);
		this.container = container;
	}

	onload() {
		this.renderReactComponent();
	}

	renderReactComponent() {
		const root = createRoot(this.container);
		root.render(<QueryDashView app={this.app} source={this.source}   />);
	}
}
