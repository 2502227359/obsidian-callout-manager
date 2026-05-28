import { Setting } from 'obsidian';
import { getCurrentColorScheme } from 'obsidian-extra';

import { CalloutSettings } from '&callout-settings';

import { CalloutColorSetting } from '&ui/setting/callout-color';
import { CalloutIconSetting } from '&ui/setting/callout-icon';

import { AppearanceEditor } from './appearance-editor';
import { PerSchemeAppearance, UnifiedAppearance } from './appearance-type';

export default class UnifiedAppearanceEditor extends AppearanceEditor<UnifiedAppearance> {
	/** @override */
	public toSettings(): CalloutSettings {
		const { otherChanges, color } = this.appearance;
		const changes = {
			...otherChanges,
			color: color,
		};

		if (color === undefined) {
			delete changes.color;
		}

		return Object.keys(changes).length === 0 ? [] : [{ changes }];
	}

	public render() {
		const { plugin, containerEl, callout, setAppearance } = this;
		const { color, otherChanges } = this.appearance;

		const colorScheme = getCurrentColorScheme(plugin.app);
		const otherColorScheme = colorScheme === 'dark' ? 'light' : 'dark';

		new CalloutColorSetting(containerEl, callout)
			.setName('颜色')
			.setDesc('修改这个 Callout 的颜色。')
			.setColorString(color)
			.onChange((color) => setAppearance({ type: 'unified', otherChanges, color }));

		new Setting(containerEl)
			.setName(`配色方案`)
			.setDesc(`为${otherColorScheme === 'dark' ? '深色' : '浅色'}模式单独设置颜色。`)
			.addButton((btn) =>
				btn
					.setClass('clickable-icon')
					.setIcon('lucide-sun-moon')
					.onClick(() => {
						const currentColor = color ?? callout.color;
						setAppearance({
							type: 'per-scheme',
							colorDark: currentColor,
							colorLight: currentColor,
							otherChanges,
						} as PerSchemeAppearance);
					}),
			);

		new CalloutIconSetting(containerEl, callout, plugin, () => this.nav)
			.setName('图标')
			.setDesc('修改这个 Callout 的图标。')
			.setIcon(otherChanges.icon)
			.onChange((icon) => setAppearance({ type: 'unified', color, otherChanges: { ...otherChanges, icon } }));
	}
}
