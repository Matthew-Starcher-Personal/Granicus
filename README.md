# NYC Parks Explorer

A frontend-only demo that helps New York City residents find and explore parks on a map or in a list. Built with Vite, React 18, TypeScript and Leaflet with OpenStreetMap tiles, from the [demo spec](https://claude.ai/artifact/SCQcPKFtz7JoihmYBn8ukF).

## Run instructions

You need Node 18 or later and npm. The map tiles load live from OpenStreetMap, so you also need network access.

```bash
npm install
npm run dev          # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the production build |
| `npm test` | Unit and component tests (Vitest) |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright end-to-end tests. Builds the app and serves it on port 4173 by itself. |

Before the first e2e run, install the Playwright browsers once with `npx playwright install`.

## What works

- **Data.** `src/data/parks.json` is bundled unchanged and normalized at load by `normalizeParks` (`src/data/normalize.ts`):
  - strings are trimmed, and blanks become `null`
  - numbers and coordinates are validated, and numbers written as plain text (`"4.7"`) are accepted
  - ratings below 0 and acreage of 0 or less are dropped, and the rest are rounded to one decimal
  - amenity slugs are canonicalized (`Dog_Run`, `dog run` and `dog-run` are one amenity) and given display labels
  - repeated image URLs are dropped
  - parks are sorted A–Z

  Records without a valid id or name are dropped.
- **List.** Each park is a button showing its name and address. `aria-current` marks the last park viewed.
- **Map.** Leaflet with OSM tiles.
  - Markers can be focused with the keyboard and opened with Enter or Space.
  - The selected marker is larger and has a ring, so color is never the only cue.
  - On load the map fits all parks, capped at street-level zoom.
- **Details.** Opening a park replaces the list with its details.
  - Missing fields are left out, with no "N/A" filler.
  - Focus moves to the park name.
  - Back or Escape returns focus to the list item or marker that opened it.
  - Photos appear only after they load, so a failed image is never shown. Alt text counts only the photos showing ("photo 1 of 1").
- **Responsive layout.** At 900px and wider, the list and map sit side by side. Below that, a List/Map toggle switches between them, and the map keeps your own panning when you switch.
- **Accessibility.**
  - a "Skip to map" link on desktop that jumps past the list or details to the map
  - each park name is read once by screen readers, not twice
  - semantic landmarks and headings
  - a two-tone focus ring that stays visible over map tiles
  - no animated panning when reduced motion is on
  - no axe violations in the automated checks

## What was left out

- **Out of scope per the spec:**
  - search, filters, "near me", directions and "open now"
  - per-park URLs and favorites
  - a backend or API, auth, analytics, i18n, dark mode and offline support
  - geocoding or correcting the source data
- **Not done, for lack of time:**
  - **A full manual code review.** The code was reviewed by Claude (24 findings, see below). By hand, I reviewed the normalization function (`src/data/normalize.ts`) and glanced over the layouts. The rest of the components, hooks, styles and tests haven't been read line by line by a person.
  - **A full accessibility audit.** The manual pass was a keyboard walkthrough and VoiceOver on macOS only, not a structured WCAG 2.2 AA audit.
  - **Visual design polish.** The look is functional but plain ("engineer art"): spacing, type scale, color and the list and details styling haven't had a design pass.
- **Remaining manual checks** (part of that audit):
  - VoiceOver on iOS, on a real iPhone
  - NVDA on Firefox (Windows)
  - 200% and 400% zoom and 320px reflow by hand (320px reflow is covered by e2e)
  - testing on real touch devices
  - a contrast check of the final colors
- **Code review items not taken on.** The code review of PR #1 found 24 items. 15 were fixed on `bugfix/review-fixes`, one commit each ([details](https://claude.ai/artifact/CF7PxWd7ASjdJMSWgFFhYd)). These were left out:
  - #1, duplicate park ids. Dropped by decision: ids are trusted, and the 12 sample records have no duplicates.
  - #9, `http://` image URLs are accepted. Not in this batch.
  - The other half of #10. A field dropped during normalization is not logged; only accepting numbers written as text was approved.
  - #18–#24, mostly test and tooling items. Not in this batch:
    - no fallback for old Safari's `matchMedia` API
    - the reduced-motion e2e test can pass without proving anything
    - e2e depends on live OSM tiles
    - unit tests don't restore `matchMedia`
    - keyboard tests depend on exact Tab counts
    - a missing mobile map-return test, as worded in the review
    - a filename in the PR description

## Important decisions

- **The JSON is the source of truth.** It is bundled unchanged, and one pure function normalizes it. Nothing is invented: a missing field is left out of the UI, not filled in.
- **Known data problems are shown as given.** Cedar Hill is plotted at its listed coordinates, even though they are almost certainly a placeholder (NYC City Hall). Ratings have no "/5" because the scale isn't confirmed.
- **Details replace the list, not a modal.** This gives one focus path that works the same on desktop and mobile.
- **On mobile, a List/Map toggle instead of a stacked layout.** Each view gets the full screen at 375px.
- **Focus moves to the park heading, with no live region.** The spec asked for a live-region announcement. But opening a park hides the list (and, on mobile, the map), so the control you activated disappears. Focus has to move, or it would drop to the top of the page. Focus goes to the park heading, which screen readers read aloud, so a live region would only say the name a second time. It was removed in fix #13.
- **The skip link goes to the map, on desktop only.** It used to jump to the list, which is already the next tab stop after the header, so it skipped nothing. Now it jumps past the list or details to the map. Mobile has no skip link, because the map is its own view behind the List/Map toggle.
- **Each name has one source.** The details article isn't labelled by its own heading, and markers get their name from Leaflet's `title` only, with no `aria-label` as well. Otherwise VoiceOver read each name twice.
- **Tiles come straight from `tile.openstreetmap.org`.** That's fine for a demo but not for public traffic (see next steps).
- **Testing stack.** Vitest, React Testing Library and vitest-axe for units and components. Playwright with axe for end-to-end, in Chromium and WebKit at 1280px and 375px.

## Known issues

- **Data:**
  - Cedar Hill's coordinates are a placeholder.
  - No image URL on `images.example.com` loads, so no photos appear anywhere.
  - Most addresses are missing a borough or ZIP.
  - Hours are free text in mixed formats.
- **Test output noise.** `npm test` prints jsdom "Not implemented" errors for `HTMLCanvasElement.getContext` and `window.scrollTo`, which come from axe and Leaflet. They're harmless, and the tests still pass.
- **E2E needs the network.** The tests load live OSM tiles, so they can be slow or flaky offline.
- **Old Safari.** `useMediaQuery` uses `MediaQueryList.addEventListener`, which Safari before 14 doesn't support. On those versions the layout won't update when the window crosses the breakpoint.
- **`http://` image URLs are accepted.** On an HTTPS host they would be blocked as mixed content. Since photos only appear once they load, a blocked image would just be hidden.
- **A weak reduced-motion test.** The e2e check for reduced motion uses a polling assertion that can pass before an animation starts, so it doesn't prove that panning is unanimated.
- **Brittle tests.** Some keyboard e2e steps count exact Tab presses, so adding a focusable control can break them without a real regression. Unit tests stub `matchMedia` without restoring it.
- **The PR #1 description is out of date.** It still says a live region announces the selection, which is no longer true since fix #13.

## How the result was checked

The automated checks were run on 2026-11-04 from a fresh clone of `bugfix/review-fixes` at `7a1e6de`, after `npm ci`.

- `npm test`: **45 passed**, with unit and component tests. They cover normalization (including each gap found in the data review), the list, the details, the toggle, and the app's focus and Escape handling, with axe checks on the components.
- `npm run test:e2e`: **38 passed, 6 skipped on purpose** (two desktop-only checks and one mobile-only check, each skipped in the other two configurations). Playwright runs in four configurations (Chromium and WebKit, each at 1280px and 375px with touch), with axe scans at key points in the flows. It covers:
  - selecting a park from the list with the keyboard, and from a map marker
  - going back
  - the skip link jumping past the details to the map
  - each marker having exactly one accessible name
  - removing images that fail to load
  - side-by-side vs. toggle layout
  - keeping the user's panning on mobile
  - reflow at 320px with no horizontal scroll
  - visible OSM attribution
  - panning without animation under reduced motion
- `npm run lint` and `npm run build` (including `tsc` type-check) pass with no errors.
- **Code review:** Claude reviewed PR #1 and found 24 items, 15 of which were fixed (see "What was left out"). By hand, I reviewed `normalize.ts` and glanced over the layouts. The rest hasn't had a full human review.
- Each review fix was its own commit with its own test where it made sense. The #4 test was checked to fail without the fix and pass with it.
- **Manual accessibility pass:**
  - a keyboard-only walkthrough of the list, map and details
  - VoiceOver on macOS

  It found two bugs, both now fixed with tests:
  - the skip link skipped nothing (`1addb71`)
  - VoiceOver read park names twice, from the details article and the map markers (`7a1e6de`)

  VoiceOver on iOS, NVDA, manual zoom, real touch devices and a contrast check are still to do. Nothing was tested on a phone.

## Most important next steps before public use

1. **Get real data from the data owner.** Correct Cedar Hill's coordinates, supply real image URLs with alt text, confirm the rating scale, and complete the addresses.
2. **Switch to a production tile provider.** OSM's tile usage policy doesn't allow public app traffic. Use a provider with an API key and keep the attribution.
3. **A full human code review** of the components, hooks, styles and tests, beyond the normalization function.
4. **A full WCAG 2.2 AA accessibility audit**, ideally by an accessibility specialist. It should include VoiceOver on a real iPhone, NVDA on Firefox, 200% and 400% zoom, real touch devices, and a contrast check of the final colors.
5. **A visual design pass** by a designer on spacing, type, color, and the list, details and marker styling. Re-run the contrast and axe checks afterwards.
6. **A full testing audit and hardening pass.**
   - **Test quality.** Check that each test can actually fail, as was done for #4. The reduced-motion test (#19) is known not to. Replace exact Tab counts with role-based focus checks, restore `matchMedia` after each unit test, and add coverage reporting to find untested paths.
   - **Test reliability.** Stub or record the map tiles so e2e doesn't depend on the live OSM servers.
   - **Wider browser coverage.** Add Firefox (only Chromium and WebKit run today) and real phones and tablets.
   - **Failure handling.** Test what happens when tiles fail to load, when the data is malformed or empty, and when JavaScript errors occur. Add an error boundary and error monitoring.
   - **Hardening.**
     - Close the user-facing review items: #9 (only allow `https://` images) and #18 (an old-Safari fallback in `useMediaQuery`).
     - Add a Content Security Policy.
     - Run `npm audit` and keep dependencies updated.
7. **Set up hosting and CI** that runs lint, unit tests and e2e on every PR. Push `bugfix/review-fixes` (it is local only), merge it and PR #1, and update the PR description for #13.
8. **Load the data from an updatable source** instead of a bundled file, if the parks list will change.

## Time spent

About 2 hours in total: the data review and spec, the build, the code review, and the fixes.
