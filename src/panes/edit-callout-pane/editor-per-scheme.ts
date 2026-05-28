
import { CalloutSetting, CalloutSettings } from '&callout-settings';

import { CalloutColorSetting } from '&ui/setting/callout-color';
import { CalloutIconSetting } from '&ui/setting/callout-icon';

import { AppearanceEditor } from './appearance-editor';
import { PerSchemeAppearance } from './appearance-type';

export default class PerSchemeAppearanceEditor extends AppearanceEditor<PerSchemeAppearance> {
	/** @override */
	public toSettings(): CalloutSettings {
		const { otherChanges, colorDark, colorLight } = this.appearance;

		const forLight: CalloutSetting = {
			condition: { colorScheme: 'light' },
			changes: {
				color: colorLight,
			},
		};

		const forDark: CalloutSetting = {
			condition: { colorScheme: 'dark' },
			changes: {
				color: colorDark,
			},
		};

		if (forLight.changes.color === undefined) delete forLight.changes.color;
		if (forDark.changes.color === undefined) delete forDark.changes.color;

		return [{ changes: otherChanges }, forLight, forDark];
	}

	protected setAppearanceOrChangeToUnified(appearance: PerSchemeAppearance): void {
		const { colorDark, colorLight, otherChanges } = appearance;

		// If both the light and dark colors are default, reset the appearance to the unified type.
		if (colorDark === undefined && colorLight === undefined) {
			this.setAppearance({ type: 'unified', color: undefined, otherChanges });
			return;
		}

		this.setAppearance(appearance);
	}

	public render() {
		const { callout, containerEl, appearance, plugin, nav } = this;
		const { colorDark, colorLight, otherChanges } = this.appearance;

		new CalloutColorSetting(containerEl, callout)
			.setName('深色模式颜色')
			.setDesc('修改这个 Callout 在深色模式下的颜色。')
			.setColorString(colorDark)
			.onChange((color) => this.setAppearanceOrChangeToUnified({ ...appearance, colorDark: color }));

		new CalloutColorSetting(containerEl, callout)
			.setName(`浅色模式颜色`)
			.setDesc(`修改这个 Callout 在浅色模式下的颜色。`)
			.setColorString(colorLight)
			.onChange((color) => this.setAppearanceOrChangeToUnified({ ...appearance, colorLight: color }));

		new CalloutIconSetting(containerEl, callout, plugin, () => nav)
			.setName('图标')
			.setDesc('修改这个 Callout 的图标。')
			.setIcon(otherChanges.icon)
			.onChange((icon) =>
				this.setAppearanceOrChangeToUnified({ ...appearance, otherChanges: { ...otherChanges, icon } }),
			);
	}
}
