import {HoverPopover, ItemView, WorkspaceLeaf} from 'obsidian';
import React from 'react';
import ReactDOM from 'react-dom';
import type MyPlugin from './main';
import { createRoot } from 'react-dom/client';

import FormDemo from "./pages/FormDemo";
import TableDemo from "./pages/TableDemo";
import AntdTableDemo from "./pages/AntdTableDemo";

export class SampleView extends ItemView {
	plugin: MyPlugin;
	hoverPopover: HoverPopover | null;
	private sampleComponent: React.ReactElement;

	constructor(leaf: WorkspaceLeaf, plugin: MyPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getDisplayText(): string {
		// TODO: Make this interactive: Either the active workspace or the local graph
		return 'Memos';
	}

	getIcon(): string {
		return 'Memos';
	}

	getViewType(): string {
		return "umi-view";
	}


	async onOpen(): Promise<void> {

		this.sampleComponent = React.createElement(AntdTableDemo);
		const root = createRoot(this.contentEl as HTMLElement);
		root.render(this.sampleComponent);

	}

	async onClose() {
		// Nothing to clean up.
	}
}
