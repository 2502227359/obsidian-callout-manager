import { ButtonComponent, Setting } from 'obsidian';

import CalloutManagerPlugin from '&plugin';

import { UIPane } from '&ui/pane';

import { getSections } from '../changelog';

import { ChangelogPane } from './changelog-pane';
import { ManageCalloutsPane } from './manage-callouts-pane';

export class ManagePluginPane extends UIPane {
	public readonly title = 'Callout Manager Local 设置';
	private plugin: CalloutManagerPlugin;

	public constructor(plugin: CalloutManagerPlugin) {
		super();
		this.plugin = plugin;
	}

	/** @override */
	public display(): void {
		const { containerEl, plugin } = this;

		// -----------------------------------------------------------------------------------------------------
		// Navigation.
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl)
			.setName('管理 Callout')
			.setDesc('创建或编辑 Markdown Callout。')
			.addButton((btn) => {
				btn.setButtonText('管理 Callout');
				btn.onClick(() => this.nav.open(new ManageCalloutsPane(plugin)));
			});

		new Setting(containerEl)
			.setName('默认 Callout')
			.setDesc('“插入默认 Callout” 命令会使用这里填写的类型，默认快捷键是 Ctrl/Cmd + Shift + C。')
			.addText((cmp) => {
				cmp.setValue(plugin.settings.defaultCallout).setPlaceholder('danger');
				cmp.inputEl.setAttribute('pattern', '^[a-z\\-]{1,}$');
				cmp.inputEl.setAttribute('required', 'required');
				cmp.onChange((value) => {
					const calloutId = value.trim().toLowerCase();
					const valid = /^[a-z-]+$/.test(calloutId);
					cmp.inputEl.classList.toggle('mod-error', !valid);
					if (!valid) return;

					plugin.settings.defaultCallout = calloutId;
					plugin.saveSettings();
				});
			});

		// -----------------------------------------------------------------------------------------------------
		// Section: Callout Detection
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl).setHeading().setName('Callout 检测');

		new Setting(containerEl)
			.setName('Obsidian')
			.setDesc(
				(() => {
					const desc = document.createDocumentFragment();
					const container = desc.createDiv();
					const method = plugin.cssWatcher.describeObsidianFetchMethod();

					container.createDiv({
						text: `查找 Obsidian 内置 Callout${method === '' ? '' : ' '}${method}。`,
					});

					return desc;
				})(),
			)
			.addToggle((setting) => {
				setting.setValue(plugin.settings.calloutDetection.obsidian).onChange((v) => {
					plugin.settings.calloutDetection.obsidian = v;
					plugin.saveSettings();
					plugin.refreshCalloutSources();
				});
			});

		new Setting(containerEl)
			.setName('主题')
			.setDesc('查找主题提供的 Callout。')
			.addToggle((setting) => {
				setting.setValue(plugin.settings.calloutDetection.theme).onChange((v) => {
					plugin.settings.calloutDetection.theme = v;
					plugin.saveSettings();
					plugin.refreshCalloutSources();
				});
			});

		new Setting(containerEl)
			.setName('CSS 片段')
			.setDesc('查找自定义 CSS 片段中的 Callout。')
			.addToggle((setting) => {
				setting.setValue(plugin.settings.calloutDetection.snippet).onChange((v) => {
					plugin.settings.calloutDetection.snippet = v;
					plugin.saveSettings();
					plugin.refreshCalloutSources();
				});
			});

		// -----------------------------------------------------------------------------------------------------
		// Section: Changelog
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl)
			.setHeading()
			.setName('更新内容')
			.setDesc(`版本 ${this.plugin.manifest.version}`)
			.addExtraButton((btn) => {
				btn.setIcon('lucide-more-horizontal')
					.setTooltip('更多更新日志')
					.onClick(() => this.nav.open(new ChangelogPane(plugin)));
			});

		const latestChanges = getSections(this.root).get(this.plugin.manifest.version);
		if (latestChanges != null) {
			const desc = document.createDocumentFragment();
			desc.appendChild(latestChanges.contentsEl);

			new Setting(containerEl)
				.setDesc(desc)
				.then((setting) => setting.controlEl.remove())
				.then((setting) => setting.settingEl.classList.add('calloutmanager-latest-changes'));
		}

		// -----------------------------------------------------------------------------------------------------
		// Section: Export
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl).setHeading().setName('导出');

		new Setting(containerEl)
			.setName('Callout 样式')
			.setDesc('把自定义 Callout 和样式修改导出为 CSS。')
			.addButton((btn) => {
				btn.setButtonText('复制');
				btn.onClick(async () => {
					btn.setDisabled(true);

					try {
						await navigator.clipboard.writeText('/* Exported Styles from Callout Manager Local */\n' + this.plugin.cssApplier.css)
						btn.setButtonText("已复制");
					} catch (ex) {
						btn.setButtonText("复制失败");
					}
				});
			});

		// -----------------------------------------------------------------------------------------------------
		// Section: Reset
		// -----------------------------------------------------------------------------------------------------
		new Setting(containerEl).setHeading().setName('重置');

		new Setting(containerEl)
			.setName('重置 Callout 设置')
			.setDesc('清空所有 Callout 样式修改。')
			.addButton(
				withConfirm((btn) => {
					btn.setButtonText('重置').onClick(() => {
						this.plugin.settings.callouts.settings = {};
						this.plugin.saveSettings();

						// Regenerate the callout styles.
						this.plugin.applyStyles();
						btn.setButtonText('重置').setDisabled(true);
					});
				}),
			);

		new Setting(containerEl)
			.setName('重置自定义 Callout')
			.setDesc('删除你创建的所有自定义 Callout。')
			.addButton(
				withConfirm((btn) => {
					btn.setButtonText('重置').onClick(() => {
						// Remove the stylings for the custom callouts.
						const { settings } = this.plugin;
						for (const custom of settings.callouts.custom) {
							delete settings.callouts.settings[custom];
						}

						// Remove the custom callouts.
						settings.callouts.custom = [];
						this.plugin.saveSettings();

						// Regenerate the callout styles.
						this.plugin.callouts.custom.clear();
						this.plugin.applyStyles();

						// Regenerate the cache.
						this.plugin.refreshCalloutSources();
						btn.setButtonText('重置').setDisabled(true);
					});
				}),
			);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withConfirm(callback: (btn: ButtonComponent) => any): (btn: ButtonComponent) => any {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let onClickHandler: undefined | ((...args: any[]) => any) = undefined;
	let resetButtonClicked = false;

	return (btn) => {
		btn.setWarning().onClick(() => {
			if (!resetButtonClicked) {
				resetButtonClicked = true;
				btn.setButtonText('确认');
				return;
			}

			if (onClickHandler != undefined) {
				onClickHandler();
			}
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		btn.onClick = (handler: (...args: any[]) => any) => {
			onClickHandler = handler;
			return btn;
		};

		// Call the callback.
		callback(btn);
	};
}

declare const STYLES: `
	.calloutmanager-latest-changes {
		padding: var(--size-4-4);

		.calloutmanager-changelog-section {
			> :first-child { margin-top: 0; }
			> :last-child { margin-bottom: 0; }
		}

		.callout {
			background: none;
		}
	}
`;
