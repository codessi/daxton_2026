# Footer CSS → Tailwind Reference

Conversion of the 47brand-style footer custom CSS to Tailwind utility classes (for reference).

## Where classes were applied

- **`sections/footer.liquid`** – Tailwind classes are on the footer elements.

---

## Conversion map

### Footer container (black bg, white text)
| CSS | Tailwind |
|-----|----------|
| `background-color: #000` | `bg-black` |
| `border-top: none` | `border-t-0` |
| `color: #fff` (footer, headings, links, copyright) | `text-white` |

### Level 1 headings (SHOP BY, ABOUT '47, etc.)
| CSS | Tailwind |
|-----|----------|
| `text-transform: uppercase` | `uppercase` |
| `font-weight: 700` | `font-bold` |
| `letter-spacing: 0.08em` | `tracking-wider` |
| `color: #fff` | `text-white` |

### Links (no hover, no underline)
| CSS | Tailwind |
|-----|----------|
| `text-decoration: none` | `no-underline` |
| `color: #fff` | `text-white` |
| `:hover` same color, no underline | `hover:text-white hover:no-underline` |
| `:focus` same | `focus:text-white focus:no-underline` |

### Content top (stretch to window)
| CSS | Tailwind |
|-----|----------|
| `width: 100%` | `w-full` |
| `max-width: 100%` | `max-w-full` |
| `padding-left/right: 3rem` | `px-8` (2rem) or `px-12` (3rem) |
| `padding-left/right: 5rem` (desktop) | `md:px-12` |
| `max-width: min(100%, calc(var(--page-width)*0.98))` | `md:max-w-[min(100%,calc(var(--page-width,120rem)*0.98))]` |
| `margin-left/right: auto` | `md:mx-auto` |
| `padding-bottom: 5rem` | `pb-20` |
| `box-sizing: border-box` | `box-border` |

### Blocks grid (level 1 horizontal, centered)
| CSS | Tailwind |
|-----|----------|
| `display: flex` | `flex` |
| `flex-direction: row` | `flex-row` |
| `flex-wrap: wrap` | `flex-wrap` |
| `justify-content: center` | `justify-center` |
| `align-items: center` | `items-center` |
| `gap: 2rem 3rem` | `gap-y-8 gap-x-12` |
| `margin-bottom: 0` | `mb-0` |

### Each footer block (column)
| CSS | Tailwind |
|-----|----------|
| `width: auto; max-width: none` | `w-auto max-w-none` |
| `margin: 0; padding: 0` | `m-0 p-0` |
| `display: flex; flex-direction: column` | `flex flex-col` |
| `min-width: 0` | `min-w-0` |
| `flex: 0 1 auto` (desktop) | `md:[&_.footer-block]:flex-[0_1_auto]` (on parent) |

### Menu block specifics (level 2 under heading)
| CSS | Tailwind |
|-----|----------|
| `.footer-block__heading { margin-bottom: 1.5rem }` | `[&_.footer-block__heading]:mb-6` |
| `.footer-block__details-content { margin-bottom: 0 }` | `[&_.footer-block__details-content]:mb-0` |
| `display: flex; flex-direction: column; gap: 0.5rem` (list) | `[&_.footer-block__details-content]:flex [&_.footer-block__details-content]:flex-col [&_.footer-block__details-content]:gap-2` |
| `li { display: block; margin: 0 }` | `[&_.footer-block__details-content_li]:block [&_.footer-block__details-content_li]:m-0` |

### Content bottom (divider)
| CSS | Tailwind |
|-----|----------|
| `border-top: solid 0.1rem rgba(255,255,255,0.15)` | `border-t border-white/15` |
| `padding-top: 3rem` | `pt-12` |

### Copyright / policies
| CSS | Tailwind |
|-----|----------|
| `color: #fff` | `text-white` on wrapper and `text-white no-underline hover:text-white hover:no-underline` on policy links |

---

## Notes

- **Arbitrary values:** `md:max-w-[min(100%,calc(var(--page-width,120rem)*0.98))]` uses Tailwind’s arbitrary value syntax for the custom max-width.
- **Arbitrary variants:** `[&_.footer-block__heading]:mb-6` uses the `[selector]:` syntax to style children (Tailwind 3.1+).
- **Mobile:** Some spacing uses `px-8`; for exact 3rem/4rem you could use `px-[3rem]` or keep a small amount of CSS for `var(--font-body-scale)` if needed.
- **section-footer.css:** The custom 47brand and grid/flex rules were removed from `section-footer.css` so these Tailwind classes control the footer. The rest of `section-footer.css` (newsletter, payment, localization, etc.) is unchanged.
