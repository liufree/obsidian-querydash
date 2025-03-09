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
		this.renderReactComponent();
	}

	renderReactComponent() {
// 获取当前语言代码（例如：'en' 或 'zh'）

		const root = createRoot(this.container);
		root.render(<QueryDashView app={this.app} source={this.source}   />);
	}
}
