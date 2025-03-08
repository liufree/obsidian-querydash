import {HoverPopover, ItemView, WorkspaceLeaf} from 'obsidian';
import React from 'react';
import ReactDOM from 'react-dom';
import type QueryDashPlugin from './main';
import { Root,createRoot } from 'react-dom/client';

import FormDemo from "./pages/FormDemo";
import TableDemo from "./pages/tableview/TableDemo";
import AntdTableDemo from "./pages/AntdTableDemo";


export class SampleView extends ItemView {
	plugin: QueryDashPlugin;
	hoverPopover: HoverPopover | null;
	private sampleComponent: React.ReactElement;
	root: Root;

	constructor(leaf: WorkspaceLeaf, plugin: QueryDashPlugin) {
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
		this.root = createRoot(this.contentEl as HTMLElement);
		this.root.render(this.sampleComponent);

	}

	async onClose() {
		// Nothing to clean up.
		this.root.unmount();
	}
}
