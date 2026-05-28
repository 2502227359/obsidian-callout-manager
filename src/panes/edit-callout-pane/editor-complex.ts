import { ButtonComponent } from 'obsidian';

import { CalloutSettings } from '&callout-settings';

import { AppearanceEditor } from './appearance-editor';
import { ComplexAppearance } from './appearance-type';

export default class ComplexAppearanceEditor extends AppearanceEditor<ComplexAppearance> {
	/** @override */
	public toSettings(): CalloutSettings {
		return this.appearance.settings;
	}

	/** @override */
	public render() {
		const { containerEl } = this;
		const { settings } = this.appearance;

		const complexJson = JSON.stringify(settings, undefined, '  ');
		containerEl.createEl('p', {
			text:
				'这个 Callout 是通过插件的 data.json 文件配置的。' +
				'为了避免误改配置，需要手动编辑它。',
		});

		containerEl.createEl('code', { cls: 'calloutmanager-edit-callout-appearance-json' }, (el) => {
			el.createEl('pre', { text: complexJson });
		});

		containerEl.createEl('p', {
			text: '也可以连续点击下面的按钮两次来重置这个 Callout。',
		});

		let resetButtonClicked = false;
		const resetButton = new ButtonComponent(containerEl)
			.setButtonText('重置 Callout')
			.setClass('calloutmanager-edit-callout-appearance-reset')
			.setWarning()
			.onClick(() => {
				if (!resetButtonClicked) {
					resetButtonClicked = true;
					resetButton.setButtonText('确认重置？');
					return;
				}

				this.setAppearance({ type: 'unified', color: undefined, otherChanges: {} });
			});
	}
}
