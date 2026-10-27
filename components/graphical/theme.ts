import type { ThemeDocument } from './lib/theme-model';

// Exact current project snapshot. Keep the internal theme identity for preview behavior.
export const theme: ThemeDocument = {
  "schemaVersion": 2,
  "name": "Sagar UI",
  "theme": {
    "name": "Grove",
    "text": {
      "xxs": { "size": 10, "lineHeight": 14 },
      "xs": { "size": 11, "lineHeight": 16 },
      "s": { "size": 12, "lineHeight": 18 },
      "m": { "size": 14, "lineHeight": 20 },
      "l": { "size": 20, "lineHeight": 28 },
      "xl": { "size": 28, "lineHeight": 34 },
      "xxl": { "size": 40, "lineHeight": 44 }
    },
    "fonts": {
      "ui": {
        "family": "\"Geist Variable\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
        "weights": {
          "heavy": 600,
          "medium": 500,
          "regular": 400
        }
      },
      "data": {
        "family": "\"Geist Mono Variable\", ui-monospace, SFMono-Regular, Menlo, monospace",
        "weights": {
          "heavy": 600,
          "medium": 500,
          "regular": 400
        }
      },
      "brand": {
        "family": "\"Geist Variable\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
        "weights": {
          "heavy": 600,
          "medium": 500,
          "regular": 400
        }
      },
      "editorial": {
        "family": "\"Geist Variable\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
        "weights": {
          "heavy": 600,
          "medium": 500,
          "regular": 400
        }
      }
    },
    "border": {
      "l": 2,
      "m": 1,
      "s": 1,
      "none": 0
    },
    "colors": {
      "dark": {
        "error": "#ff5263",
        "color-1": "#ededed",
        "color-2": "#76ef6b",
        "color-3": "#009ff0",
        "color-4": "#e864ff",
        "success": "#76ef6b",
        "warning": "#ffa344",
        "neutral-1": "#252525",
        "neutral-2": "#2b2b2b",
        "neutral-3": "#343434",
        "neutral-4": "#464646",
        "neutral-5": "#606060",
        "neutral-6": "#858585",
        "neutral-7": "#a3a3a3",
        "neutral-8": "#c6c6c6",
        "neutral-9": "#e5e5e5",
        "neutral-10": "#ffffff"
      },
      "light": {
        "error": "#ff5263",
        "color-1": "#171717",
        "color-2": "#76ef6b",
        "color-3": "#009ff0",
        "color-4": "#e864ff",
        "success": "#76ef6b",
        "warning": "#ffa344",
        "neutral-1": "#ffffff",
        "neutral-2": "#fafafa",
        "neutral-3": "#f0f0f0",
        "neutral-4": "#dedede",
        "neutral-5": "#c5c5c5",
        "neutral-6": "#969696",
        "neutral-7": "#6c6c6c",
        "neutral-8": "#454545",
        "neutral-9": "#252525",
        "neutral-10": "#000000"
      }
    },
    "radius": {
      "zero": 0,
      "xs": 2,
      "s": 4,
      "m": 6,
      "l": 12,
      "xl": 16,
      "full": 9999
    },
    "shadows": {
      "l": {
        "x": 0,
        "y": 12,
        "blur": 30,
        "color": {
          "dark": "neutral-1",
          "light": "neutral-10"
        },
        "spread": 0,
        "opacity": 0
      },
      "m": {
        "x": 0,
        "y": 8,
        "blur": 24,
        "color": {
          "dark": "neutral-1",
          "light": "neutral-10"
        },
        "spread": 0,
        "opacity": 0
      },
      "s": {
        "x": 0,
        "y": 1,
        "blur": 2,
        "color": {
          "dark": "neutral-1",
          "light": "neutral-10"
        },
        "spread": 0,
        "opacity": 0
      }
    },
    "spacing": {
      "zero": 0,
      "xxs": 2,
      "xs": 4,
      "s": 8,
      "m": 12,
      "l": 16,
      "xl": 24,
      "xxl": 32
    },
    "animation": {
      "large": {
        "easing": [
          0.16,
          1,
          0.3,
          1
        ],
        "duration": 300
      },
      "easing": [
        0.2,
        0.8,
        0.2,
        1
      ],
      "duration": 150,
      "popupScale": 0.96,
      "pressDistance": 1
    },
    "iconStyle": "outlined",
    "iconFamily": "Lucide",
    "colorEmphasis": 0.8333333333333334,
    "letterSpacing": {
      "l": 0.01,
      "m": 0,
      "s": -0.01,
      "xl": 0.02,
      "xs": -0.02
    },
    "primaryForeground": {},
    "primaryActionColor": "neutral-10",
    "colorPalettes": [
      {
        "id": "grove-signal",
        "name": "Signal",
        "description": "Bright green with cyan, electric yellow, and violet accents.",
        "colors": {
          "light": [
            "#76ef6b",
            "#00c9bb",
            "#E0E709",
            "#e864ff"
          ],
          "dark": [
            "#76ef6b",
            "#00c9bb",
            "#f4f83b",
            "#e864ff"
          ]
        },
        "primaryForeground": {
          "light": "neutral-9",
          "dark": "neutral-2"
        }
      },
      {
        "id": "grove-electric",
        "name": "Electric",
        "description": "Electric yellow with green, blue, and violet accents.",
        "colors": {
          "light": [
            "#E0E709",
            "#76ef6b",
            "#009ff0",
            "#e864ff"
          ],
          "dark": [
            "#f4f83b",
            "#76ef6b",
            "#009ff0",
            "#e864ff"
          ]
        },
        "primaryForeground": {
          "light": "neutral-9",
          "dark": "neutral-2"
        }
      },
      {
        "id": "grove-cyan",
        "name": "Cyan",
        "description": "Clear cyan with blue, green, and violet accents.",
        "colors": {
          "light": [
            "#00c9bb",
            "#009ff0",
            "#76ef6b",
            "#e864ff"
          ],
          "dark": [
            "#00c9bb",
            "#009ff0",
            "#76ef6b",
            "#e864ff"
          ]
        },
        "primaryForeground": {
          "light": "neutral-9",
          "dark": "neutral-2"
        }
      },
      {
        "id": "grove-blue",
        "name": "Blue",
        "description": "Vivid blue with cyan, green, and violet accents.",
        "colors": {
          "light": [
            "#009ff0",
            "#00c9bb",
            "#76ef6b",
            "#e864ff"
          ],
          "dark": [
            "#009ff0",
            "#00c9bb",
            "#76ef6b",
            "#e864ff"
          ]
        },
        "primaryForeground": {
          "light": "neutral-9",
          "dark": "neutral-2"
        }
      },
      {
        "id": "grove-violet",
        "name": "Violet",
        "description": "Bright violet with cyan, green, and blue accents.",
        "colors": {
          "light": [
            "#e864ff",
            "#00c9bb",
            "#76ef6b",
            "#009ff0"
          ],
          "dark": [
            "#e864ff",
            "#00c9bb",
            "#76ef6b",
            "#009ff0"
          ]
        },
        "primaryForeground": {
          "light": "neutral-9",
          "dark": "neutral-2"
        }
      },
      {
        "id": "grove-monochrome",
        "name": "Monochrome",
        "description": "Charcoal and clear grays for a neutral technical interface.",
        "colors": {
          "light": [
            "#262626",
            "#707070",
            "#b6b6b6",
            "#e8e8e8"
          ],
          "dark": [
            "#e5e5e5",
            "#b1b1b1",
            "#777777",
            "#424242"
          ]
        },
        "primaryForeground": {
          "light": "neutral-2",
          "dark": "neutral-2"
        }
      },
      {
        "id": "grove-orange",
        "name": "Orange",
        "description": "Bright orange with cyan, green, and violet accents.",
        "colors": {
          "light": [
            "#ffa344",
            "#00c9bb",
            "#76ef6b",
            "#e864ff"
          ],
          "dark": [
            "#ffa344",
            "#00c9bb",
            "#76ef6b",
            "#e864ff"
          ]
        },
        "primaryForeground": {
          "light": "neutral-9",
          "dark": "neutral-2"
        }
      }
    ],
    "paletteBaseNeutrals": {
      "light": {
        "neutral-1": "#ffffff",
        "neutral-2": "#fafafa",
        "neutral-3": "#f0f0f0",
        "neutral-4": "#dedede",
        "neutral-5": "#c5c5c5",
        "neutral-6": "#969696",
        "neutral-7": "#6c6c6c",
        "neutral-8": "#454545",
        "neutral-9": "#252525",
        "neutral-10": "#000000"
      },
      "dark": {
        "neutral-1": "#000000",
        "neutral-2": "#202020",
        "neutral-3": "#2b2b2b",
        "neutral-4": "#383838",
        "neutral-5": "#505050",
        "neutral-6": "#777777",
        "neutral-7": "#a3a3a3",
        "neutral-8": "#c6c6c6",
        "neutral-9": "#e5e5e5",
        "neutral-10": "#ffffff"
      }
    },
    "keyColorPalette": [
      "#76ef6b",
      "#E0E709",
      "#00c9bb",
      "#009ff0",
      "#e864ff",
      "#262626",
      "#ffa344"
    ]
  },
  "componentTokens": {
    "tooltip:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "m",
      "textSize": "s"
    },
    "select:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "xs",
      "radius": "m",
      "gap": "xs"
    },
    "select:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "combobox:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "xs",
      "radius": "m",
      "gap": "xs"
    },
    "combobox:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "autocomplete:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "xs",
      "radius": "m",
      "gap": "xs"
    },
    "autocomplete:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "menu:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "xs",
      "radius": "m",
      "gap": "xs"
    },
    "menu:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "context-menu:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "xs",
      "radius": "m",
      "gap": "xs"
    },
    "context-menu:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "menubar:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "xs",
      "radius": "m",
      "gap": "xs"
    },
    "menubar:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "navigation-menu:default:part:popover:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "xs",
      "radius": "m",
      "gap": "xs"
    },
    "navigation-menu:default:part:option:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "navigation-menu:default:part:link:rest": {
      "paddingTop": "xs",
      "paddingBottom": "xs",
      "paddingX": "s",
      "radius": "s"
    },
    "scroll-area:default:part:content:rest": {
      "paddingTop": "s",
      "paddingBottom": "s",
      "paddingX": "m"
    },
    "checkbox:default:part:control:rest": {
      "controlSize": "l",
      "borderColor": "neutral-5"
    },
    "checkbox-group:default:part:control:rest": {
      "controlSize": "l",
      "borderColor": "neutral-5"
    },
    "radio:default:part:control:rest": {
      "controlSize": "l",
      "borderColor": "neutral-5"
    },
    "radio-group:default:part:control:rest": {
      "controlSize": "l",
      "borderColor": "neutral-5"
    },
    "switch:default:part:row:rest": {
      "gap": "s"
    },
    "switch:default:part:label:rest": {
      "textSize": "m"
    },
    "checkbox:default:part:label:rest": {
      "textSize": "m"
    },
    "switch:default:part:control:rest": {
      "controlSize": "xl"
    }
  },
  "componentVariants": {}
};
