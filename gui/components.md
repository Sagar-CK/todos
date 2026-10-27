# Component specifications

Each theme below includes a focused specification for every component in Graphical's preview catalog. Specifications combine the preview's resolved values with anatomy, geometry, state, and composition rules. Authored refinements are part of the target, not optional suggestions. Read the relevant files when building individual components; read every entry when setting up the full library.

Both setup choices include all specifications. When the full library is selected, components/graphical/ also contains the actual preview components, their shared styling runtime, styles.css, and the current theme.ts snapshot. Use that implementation directly and follow the component setup in base-ui.md; specifications explain and verify it, not replace it. The theme-and-skills choice includes no component source or component dependency installation; build or style components as needed. Follow the selected setup in GUI.md when present.

For a full installation, track every component below as implemented, reused and verified, or blocked with a concrete reason, and provide its import path. Also check the receiving version's [official Base UI catalog](https://base-ui.com/llms.txt) for supported additions; disclose components without a Graphical preview specification instead of claiming a verified visual match. Utility providers and hooks are integration tools, not standalone visual components.

Preserve the supplied assets and resolved styles. Free fallbacks can change appearance and must be disclosed. Honor the receiving app's dependency and review policies; only claim visual parity for what was actually verified.

## Sagar UI

[Theme foundations](themes/sagar-ui.md) · [Effective assignment tables](themes/sagar-ui-components.md)

- [Accordion](components/sagar-ui/accordion.md)
- [Alert dialog](components/sagar-ui/alert-dialog.md)
- [Autocomplete](components/sagar-ui/autocomplete.md)
- [Avatar](components/sagar-ui/avatar.md)
- [Button](components/sagar-ui/button.md)
- [Checkbox](components/sagar-ui/checkbox.md)
- [Checkbox group](components/sagar-ui/checkbox-group.md)
- [Collapsible](components/sagar-ui/collapsible.md)
- [Combobox](components/sagar-ui/combobox.md)
- [Context menu](components/sagar-ui/context-menu.md)
- [Dialog](components/sagar-ui/dialog.md)
- [Drawer](components/sagar-ui/drawer.md)
- [Field](components/sagar-ui/field.md)
- [Fieldset](components/sagar-ui/fieldset.md)
- [Form](components/sagar-ui/form.md)
- [Menu](components/sagar-ui/menu.md)
- [Menubar](components/sagar-ui/menubar.md)
- [Meter](components/sagar-ui/meter.md)
- [Navigation menu](components/sagar-ui/navigation-menu.md)
- [Number field](components/sagar-ui/number-field.md)
- [OTP field](components/sagar-ui/otp-field.md)
- [Popover](components/sagar-ui/popover.md)
- [Preview card](components/sagar-ui/preview-card.md)
- [Progress](components/sagar-ui/progress.md)
- [Radio](components/sagar-ui/radio.md)
- [Radio group](components/sagar-ui/radio-group.md)
- [Scroll area](components/sagar-ui/scroll-area.md)
- [Select](components/sagar-ui/select.md)
- [Separator](components/sagar-ui/separator.md)
- [Slider](components/sagar-ui/slider.md)
- [Switch](components/sagar-ui/switch.md)
- [Tabs](components/sagar-ui/tabs.md)
- [Text field](components/sagar-ui/input.md)
- [Toast](components/sagar-ui/toast.md)
- [Toggle](components/sagar-ui/toggle.md)
- [Toggle group](components/sagar-ui/toggle-group.md)
- [Toolbar](components/sagar-ui/toolbar.md)
- [Tooltip](components/sagar-ui/tooltip.md)
