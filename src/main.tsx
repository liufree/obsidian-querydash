import {Editor, MarkdownView, Notice, Plugin} from 'obsidian';
import SampleSettingTab from './components/SampleSettingTab';
import SampleModal from "./components/SampleModal";

import {SampleView} from "./sampleView";
import {SAMPLE_VIEW_TYPE} from './constants';
import React from "react";
import AntdTableDemo from "./pages/AntdTableDemo";
import TableDemo from "./pages/tableview/TableDemo";
import {StrictMode} from 'react';
import ReactDemo from "./pages/ReactDemo";
import {Root, createRoot} from 'react-dom/client';

interface MyPluginSettings {
	//	mySetting: string;
	language: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	// 	mySetting: 'default',
	language: 'en-US'
}

export default class QueryDashPlugin extends Plugin {

	settings: MyPluginSettings;
	root: Root | null = null;

	async onload() {

		console.log('Welcome to the QueryDash plugin.');
		await this.loadSettings();
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerMarkdownCodeBlockProcessor('querydash', (source, el, ctx) => {

			const container = el.createDiv();
			const reactComponent = new ReactDemo(container, source, this.app);
			ctx.addChild(reactComponent);
		});


		//	this.registerView(SAMPLE_VIEW_TYPE, (leaf) => new SampleView(leaf, this));

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// 	this.openMemos();
		// });
		// Perform additional things with the ribbon
		//	ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		// statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });
		// This adds an editor command that can perform some operation on the current editor instance
		// this.addCommand({
		// 	id: 'sample-editor-command',
		// 	name: 'Sample editor command',
		// 	editorCallback: (editor: Editor, view: MarkdownView) => {
		// 		console.log(editor.getSelection());
		// 		editor.replaceSelection('Sample Editor Command');
		// 	}
		// });
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}
		//
		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });


	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// async openMemos() {
	// 	const workspace = this.app.workspace;
	// 	workspace.detachLeavesOfType(SAMPLE_VIEW_TYPE);
	// 	// const leaf = workspace.getLeaf(
	// 	//   !Platform.isMobile && workspace.activeLeaf && workspace.activeLeaf.view instanceof FileView,
	// 	// );
	// 	const leaf = workspace.getLeaf(false);
	// 	await leaf.setViewState({type: SAMPLE_VIEW_TYPE});
	// 	workspace.revealLeaf(leaf);
	//
	// }
}

