import {Plugin} from 'obsidian';
import ReactComponent from "./pages/ReactComponent";
import {Root} from 'react-dom/client';
import {DashTableView, TableViewType} from "./pages/bases/DashTableView";


export default class QueryDashPlugin extends Plugin {

	root: Root | null = null;

	async onload() {

		this.registerMarkdownCodeBlockProcessor('querydash', (source, el, ctx) => {
			const container = el.createDiv();
			const reactComponent = new ReactComponent(container, source, this.app);
			ctx.addChild(reactComponent);
		});

		this.registerBasesView(TableViewType, {
			name: 'dash-table-view',
			icon: 'lucide-graduation-cap',
			factory: (controller, containerEl) =>
				new DashTableView(controller, containerEl)
		});

	}

	onunload() {

	}

}

