import {HoverPopover, ItemView, WorkspaceLeaf} from 'obsidian';
import React from 'react';
import ReactDOM from 'react-dom';
import type MyPlugin from './main';

import FormDemo from "./pages/FormDemo";

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

		this.sampleComponent = React.createElement(FormDemo);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ReactDOM.render(this.sampleComponent, (this as any).contentEl);
	}

	async onClose() {
		// Nothing to clean up.
	}
}
