# Performance Audit Report

## Baseline Performance Report (`slow-version`)

| Metric / Issue | Baseline Score / Observation | Root Cause Analysis | Proposed Solution Hypothesis |
| :--- | :--- | :--- | :--- |
| **LCP** | 4.8s | Large, unoptimized hero image (2.5MB+) loading late without dimensions. | Compress image to WebP, serve with `srcset`, add `width`/`height`, and `loading="lazy"`. |
| **INP (from TBT)** | TBT: ~1800ms | Re-rendering 500 unvirtualized DOM nodes on filter input keystrokes; expensive date formatting in render loop. | Implement list virtualization (render only visible items) and memoize date formatting. |
| **CLS** | 0.85 | Hero image loading without explicit dimensions pushes content down. | Add explicit `width` and `height` attributes to the `<img>` tag. |
| **Bundle Size (main.js)** | 2.1MB | Importing full `lodash` library without tree-shaking; no code splitting. | Use cherry-picked imports (e.g., `lodash/sortBy`); use `React.lazy` for code splitting. |
| **Network Waterfall** | 501 sequential requests | `for` loop fetching 500 items sequentially after the top stories fetch. | Parallelize item fetching using `Promise.all`. |

## Optimizations (`main` branch)

*(To be filled during optimization phase)*

