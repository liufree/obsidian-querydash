import {HoverPopover, ItemView, WorkspaceLeaf} from 'obsidian';
import React from 'react';
import ReactDOM from 'react-dom';
import type MyPlugin from './main';

import IndexPage from './pages/index';

export class Memos extends ItemView {
  plugin: MyPlugin;
  hoverPopover: HoverPopover | null;
  private memosComponent: React.ReactElement;

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

	  this.memosComponent = React.createElement(IndexPage);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ReactDOM.render(this.memosComponent, (this as any).contentEl);
  }

  async onClose() {
    // Nothing to clean up.
  }
}

export let InsertAfter: string;
export let UserName: string;
export let ProcessEntriesBelow: string;
export let SaveMemoButtonLabel: string;
export let SaveMemoButtonIcon: string;
export let DefaultPrefix: string;
export let InsertDateFormat: string;
export let DefaultEditorLocation: string;
export let UseButtonToShowEditor: boolean;
export let FocusOnEditor: boolean;
export let OpenDailyMemosWithMemos: boolean;
export let HideDoneTasks: boolean;
export let ShareFooterStart: string;
export let ShareFooterEnd: string;
export let OpenMemosAutomatically: boolean;
// export let EditorMaxHeight: string;
export let ShowTime: boolean;
export let ShowDate: boolean;
export let AddBlankLineWhenDate: boolean;
export let AutoSaveWhenOnMobile: boolean;
export let QueryFileName: string;
export let DeleteFileName: string;
export let UseVaultTags: boolean;
export let DefaultDarkBackgroundImage: string;
export let DefaultLightBackgroundImage: string;
export let DefaultMemoComposition: string;
export let ShowTaskLabel: boolean;
export let CommentOnMemos: boolean;
export let CommentsInOriginalNotes: boolean;
export let FetchMemosMark: string;
export let FetchMemosFromNote: boolean;
export let ShowCommentOnMemos: boolean;
export let UseDailyOrPeriodic: string;
export let ShowLeftSideBar: boolean;
