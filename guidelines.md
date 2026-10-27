# Guidelines

## The rule

> Avoid unnecessary secondary labels and descriptions. Let the layout do the explaining.

Before adding any text, ask: does the screen work without it? If yes, leave it out. Grouping, order, alignment, and the component itself carry meaning first. Words come last.

## Copy

Clear, short, and literal. Write what the thing is or does, nothing else.

- Sentence case everywhere. No title case, no all caps.
- Buttons are verbs that name the result: `Save`, `Archive project`, `Invite`. Not `OK`, `Submit`, `Click here`.
- Titles are nouns: `Members`, `Billing`. Not `Manage your members`.
- One title per screen. No eyebrow above it, no subtitle under it.
- No descriptions that restate a title or label.
- No filler: `please`, `simply`, `just`, `easily`, `you can`, `in order to`, `welcome to`.
- No ending punctuation in titles, labels, buttons, or menu items.
- Numbers as digits: `3 members`, not `three members`.
- Every input has a visible label. Placeholders show an example value, never the label or instructions.
- Errors say what happened and how to fix it, in one line: `Enter an email address`.
- Empty states are one line plus the action: `No projects` + `New project`.
- Confirmations name the object and the consequence: `Delete "Q3 plan"?` with `Delete` / `Cancel`.
- Use the same word for the same thing everywhere. Pick `Remove` or `Delete`, not both.
- Essential information is never hidden in a tooltip.
- No em dashes. Use a full stop, colon, or comma.
- No hype words or slogan contrasts (`not X, but Y`). State what the thing does.

| Instead of                                        | Write                                        |
| ------------------------------------------------- | -------------------------------------------- |
| Manage your notification preferences below.       | (nothing)                                    |
| Notifications: Choose how you want to be notified | Notifications                                |
| Click here to create a new project                | New project                                  |
| Are you sure you want to proceed?                 | Archive "Q3 plan"?                           |
| Oops! Something went wrong. Please try again.     | Couldn't save. Retry                         |
| Enter your email address here...                  | Label: Email · Placeholder: name@company.com |

## Spacing

Only use spacing tokens. Never write a raw pixel value in a screen.

| Token | Value | Use                                                |
| ----- | ----- | -------------------------------------------------- |
| xxs   | 2px   | Hairline offsets, icon nudges                      |
| xs    | 4px   | Inside controls; between a label and its control   |
| s     | 8px   | Between related items: buttons in a row, list rows |
| m     | 12px  | Card and popup padding; between fields in a form   |
| l     | 16px  | Between groups inside a section                    |
| xl    | 24px  | Between sections; page padding on desktop          |
| xxl   | 32px  | Between major page regions                         |

- Space grows with distance in meaning. Related things sit closer than unrelated things, always.
- The same relationship gets the same space everywhere. If two cards are 8px apart on one screen, they are 8px apart on every screen.
- Use `gap` on a parent, not margins on children.
- Padding is symmetric unless there is a reason (e.g. a scrollbar).
- Page padding: `xl` on desktop, `l` on mobile.

## Sizing

- Controls are 28px tall. Buttons, inputs, selects, and toggles in the same row share one height.
- Text uses three sizes on a screen: `m` (14px) for body and controls, `s` (12px) for metadata, `l` (20px) for the page title. Nothing larger inside the product.
- Hierarchy comes from weight (400 / 500 / 600) and neutral step, not extra sizes.
- Icons are 16px, 14px in dense rows. Icons sit beside text, not instead of a needed label.
- Reading width is at most 720px. Forms are 320–400px wide.
- Radius: `m` (6px) for controls, `l` (12px) for cards and popups. Don't mix radii within a component.

## Layout

- Group by proximity first, then a separator, then a container. Use a card only when the boundary helps.
- No nested cards.
- One primary action per region, placed where the eye ends: top right of a page, bottom right of a dialog.
- Align everything to one left edge. Labels, inputs, and text in a column share it.
- Lists and tables use rows, not cards.
- Destructive actions sit apart from the primary action and use an alert dialog.

## States

Every screen handles these before it ships:

- **Empty.** One line plus the action that fills it.
- **Loading.** Keep the layout; show progress in place with `Shimmer` status text inside `Delayed`, so fast loads show nothing. Arriving content uses `BlurIn`; streamed text uses `StreamingText`. No layout jumps when data arrives.
- **Error.** Inline, next to what failed, with a way to recover.
- **Disabled.** Only when the reason is obvious from context. Otherwise hide the action or explain it in one line.

## Motion

- Small curve (150ms) for hover, press, toggles, menus, tooltips.
- Large curve (300ms) for dialogs and drawers.
- Reveal (220ms blur-in) for content that arrives: pages, panels, results, streamed text.
- No spinners. In-progress work is a shimmer on its status text.
- Never invent a duration or easing. Use `var(--motion-*)` or the components' built-in motion.
- Respect reduced motion.

## Avoid

Patterns that make an interface look generated. Full catalog: [impeccable.style/slop](https://impeccable.style/slop/).

- Colored side stripes on cards, quotes, or callouts. Use a status only when there is a status.
- Heavy colored borders on rounded cards. A hairline or the background defines the card.
- A hairline border and a wide shadow on the same element. Pick one.
- Purple, violet, or cyan accents by default. The accent is ink; color is for status.
- Gradient text, glows, halos, spotlights, and glass. Emphasis comes from size, weight, and position.
- Decorative grids, stripes, and placeholder illustrations.
- Labels, badges, or icon tiles stacked above a heading.
- Numbered section labels when there is no sequence.
- Identical card grids. Group and size content by importance.
- Nested cards.
- Uniform spacing that hides grouping. Related items sit closer than unrelated ones.
- Pulsing dots, blinking cursors, marquees, and bouncy or elastic easing.
- Crushed letter spacing.

## Building a screen

1. Write the title and the primary action.
2. List the content. Cut anything the user doesn't need to act.
3. Group by meaning and space the groups with the scale above.
4. Use existing components from `components/graphical`. Don't restyle them per screen.
5. Add copy only where the layout can't explain it.
6. Check light, dark, keyboard, narrow width, empty, loading, and error.

## Review

- Can any label or description be removed without losing meaning?
- Is every spacing, size, color, and radius a token?
- Do equal relationships have equal spacing?
- Are all controls in a row the same height?
- Is the primary action obvious and the only one in its region?
- Does copy use plain verbs and nouns, in sentence case, without filler?
- Does anything from the Avoid list appear?
