# Rx Mission Control

Mission Control for ProPublica’s [Rx Inspector](https://projects.propublica.org/rx-inspector/) data, from the
[Rx Roulette](https://www.propublica.org/series/rx-roulette) series. Find where your generic prescription drug was made,
then explore every factory on a rotating globe, with its FDA inspection history, Form 483s, warning letters and import alerts.

It is a static web app built for GitHub Pages.

## Features

- **Rotating globe** of every geocoded manufacturing facility, colored by its latest FDA action. Drag, zoom and pick
  facilities with a pointer, touch or the keyboard. A non-visual browse control and data tables give the same access.
- **The same search as ProPublica**: guided search by drug name and company, NDC lookup, the advanced query syntax
  (`"exact"`, `AND`, `OR`, `-exclude`, `+required`, `( )`, `"prefix"*`), facet filters (dose, form, shape, color,
  imprint, flavor, NDC, labeler), label pages and facility pages with full action timelines.
- **Insights**: accessible charts of inspections over time, warning letters, countries, citations, labelers and
  ingredients, plus a side-by-side country comparison.
- **Two themes**: *Standard*, modeled on ProPublica’s news-app look, and *ASCII*, a terminal look drawn with
  [ascii.rest](https://ascii.rest/). In ASCII mode the globe itself is drawn in characters.
- **Accessibility**: the target is WCAG 2.2 AA. The app has landmarks, a skip link, full keyboard support and visible
  focus, plus `aria-live` announcements, table alternatives for every chart and the globe, and support for reduced motion.
- **Responsive** layouts for phones, tablets and desktops.

## Development

```sh
npm install
npm run dev          # local dev server
npm test             # unit, component, axe and dataset-integrity tests (Vitest)
npm run build        # type-check + production build into dist/
npm run test:e2e     # Playwright + axe on desktop, tablet and mobile, in both themes
npm run verify       # all of the above
```

## Data pipeline

The data in `public/data/` combines two ProPublica sources:

1. **[propublica/rx-inspector-data](https://github.com/propublica/rx-inspector-data)**, ProPublica’s public release that
   links product NDCs to facility FEIs. A copy is vendored in `data/propublica/ndc_fei.csv` and is the authoritative
   source for which facilities make which drug, including which facilities make only the active ingredient (API).
2. **A snapshot of the Rx Inspector site** for everything the release leaves out: inspections and citations, Form 483s,
   warning letters, import alerts, facility addresses and label details such as pill color, shape and imprint. The site
   offers no CORS, so a static app cannot query it live.

```sh
npm run crawl        # polite, resumable crawl of Rx Inspector into data/raw/ (HTTP responses are cached)
npm run build:data   # normalize + geocode into public/data/
```

- `scripts/crawl.ts` runs a breadth-first search. It seeds from common drugs, facility terms and every FEI in the public
  release, then expands through every ingredient, labeler and facility it finds until no new ones turn up.
- `scripts/lib/geocode.ts` places each facility offline using [GeoNames](https://www.geonames.org/) (CC BY 4.0). It tries
  the postal code first, then the city, the region and finally the country. Each facility records the precision used.
- `scripts/lib/release.ts` merges the release’s links into the labels. `scripts/dataset.test.ts` checks that every link in
  the release appears in the built data.
- `scripts/build-data.ts` writes `meta.json`, `facilities.json`, `labels.json`, `insights.json` and one
  `facilities/{FEI}.json` file per facility. The shared contract is in `src/data/types.ts`.

To refresh, download the GeoNames files listed in `scripts/lib/gazetteer.ts` into `data/geo/`, run both commands and commit `public/data`.

## Deployment

`.github/workflows/ci.yml` type-checks, runs the unit and end-to-end suites, builds the app and deploys `dist/` to
GitHub Pages on every push to `main`. Turn it on under **Settings → Pages → Source: GitHub Actions**. The build uses
relative asset paths and hash routing, so it works under any Pages path.

## Credits and license

ProPublica’s data is licensed [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/): noncommercial use only,
with attribution to ProPublica and a link to [Rx Inspector](https://projects.propublica.org/rx-inspector/). This project
is noncommercial.

All data and reporting come from ProPublica’s Rx Inspector, by Brandon Roberts, Ruth Talbot and Nick McMillan. Read the
[methodology](https://www.propublica.org/article/rx-inspector-fda-generic-drug-tool-methodology). This is an independent
visualization and is not affiliated with ProPublica. ProPublica does not provide medical advice.
ASCII art by [ascii.rest](https://ascii.rest/) (MIT). Basemap from Natural Earth via `world-atlas`.
