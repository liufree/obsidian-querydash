import {Editor, MarkdownView, Notice, Plugin} from 'obsidian';
import SampleSettingTab from './components/SampleSettingTab';
import SampleModal from "./components/SampleModal";

import {SampleView} from "./sampleView";
import {SAMPLE_VIEW_TYPE} from './constants';
import React from "react";
import AntdTableDemo from "./pages/AntdTableDemo";
import TableDemo from "./pages/TableDemo";
import {StrictMode} from 'react';
import ReactDemo from "./pages/ReactDemo";
import { Root, createRoot } from 'react-dom/client';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	root: Root | null = null;

	async onload() {
		await this.loadSettings();

		this.registerView(SAMPLE_VIEW_TYPE, (leaf) => new SampleView(leaf, this));

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
			this.openMemos();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

		// 代码块中标注table的绘制成sampleView
		this.registerMarkdownCodeBlockProcessor('sample', (source, el, ctx) => {

			console.log("start")
			console.log('source',source)
			console.log('ctx',ctx)
		//	插入一个div
			const container = el.createDiv();

			// 创建一个 MarkdownRenderChild 实例
			const reactComponent = new ReactDemo(container, source,this.app);
			ctx.addChild(reactComponent);

		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async openMemos() {
		const workspace = this.app.workspace;
		workspace.detachLeavesOfType(SAMPLE_VIEW_TYPE);
		// const leaf = workspace.getLeaf(
		//   !Platform.isMobile && workspace.activeLeaf && workspace.activeLeaf.view instanceof FileView,
		// );
		const leaf = workspace.getLeaf(false);
		await leaf.setViewState({type: SAMPLE_VIEW_TYPE});
		workspace.revealLeaf(leaf);

	}
}

