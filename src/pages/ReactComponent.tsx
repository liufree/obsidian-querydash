import {App, MarkdownRenderChild} from 'obsidian';
import * as React from 'react';
import {createRoot, Root} from "react-dom/client";
import QueryDashView from "./QueryDashView";
import { Platform } from 'obsidian';


export  default class ReactComponent extends MarkdownRenderChild {
	root: Root;
	container: HTMLElement;

	constructor(container: HTMLElement, private source: string, private app: App) {
        super(container);
		this.container = container;
	}

	onload() {
		super.onload();
		this.renderReactComponent();
	}

	renderReactComponent() {
		const root = createRoot(this.container);
		this.root = root;
		root.render(<QueryDashView app={this.app} source={this.source} />);
	}
	
	onunload() {
		if (this.root) {
			this.root.unmount();
		}
		super.onunload();
	}
}
