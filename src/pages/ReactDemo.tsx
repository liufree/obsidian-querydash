import {App, Plugin, MarkdownRenderChild} from 'obsidian';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import TableDemo from "./TableDemo";
import AntdTableDemo from "./AntdTableDemo";
import {createRoot, Root} from "react-dom/client";

export  default class ReactComponent extends MarkdownRenderChild {
	private sampleComponent: React.ReactElement;
	root: Root;
	container: HTMLElement;

	constructor(container: HTMLElement, private source: string, private app: App) {
        super(container);
		this.container = container;
	}

	onload() {
		// 渲染 React 组件
		this.renderReactComponent();
	}

	renderReactComponent() {
		// 使用 ReactDOM.render 渲染 React 组件

		// 使用 createRoot 渲染 React 组件
		const root = createRoot(this.container);
		root.render(<TableDemo app={this.app} source={this.source}   />);
	}
}
