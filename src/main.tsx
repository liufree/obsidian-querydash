import {Plugin} from 'obsidian';
import ReactComponent from "./pages/ReactComponent";
import {Root} from 'react-dom/client';


export default class QueryDashPlugin extends Plugin {

	root: Root | null = null;

	async onload() {

		this.registerMarkdownCodeBlockProcessor('querydash', (source, el, ctx) => {
			const container = el.createDiv();
			const reactComponent = new ReactComponent(container, source, this.app);
			ctx.addChild(reactComponent);
		});
	}

	onunload() {

	}

}

