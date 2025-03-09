import {App, PluginSettingTab, Setting} from "obsidian";
import QueryDashPlugin from "../main";

class SampleSettingTab extends PluginSettingTab {
	plugin: QueryDashPlugin;

	constructor(app: App, plugin: QueryDashPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #3')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

export default SampleSettingTab;
