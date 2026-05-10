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

| Optimization Step | Change Description | Before Metric | After Metric (Observation) | Why It Improved |
| :--- | :--- | :--- | :--- | :--- |
| **1. Parallelize Network Requests** | Used `Promise.all` instead of a sequential `for` loop to fetch articles. | Network Waterfall: 501 serial requests | Parallel requests (significantly faster load time) | Browsers can handle multiple concurrent connections. Fetching all article details simultaneously removes the bottleneck of waiting for each request to finish before starting the next. |
| **2. Implement List Virtualization** | Integrated `@tanstack/react-virtual` to render only visible `ArticleItem` components. | INP/TBT: ~1800ms, 500 DOM nodes | TBT: <100ms, <50 DOM nodes rendered | Virtualization ensures that the browser only has to compute styles and layout for a small number of elements, drastically reducing main thread blocking time during scroll and filter interactions. |
| **3. Optimize Dependencies & Calcs** | Cherry-picked `lodash` imports and moved `Intl.DateTimeFormat` outside component; wrapped item in `React.memo`. | Bundle size 2.1MB; slow filter inputs | Bundle size ~230KB; instantaneous filter | Tree-shaking lodash eliminates unused library code. Memoizing date formatting and components prevents unnecessary recalculations and re-renders when state (like filter queries) changes. |
| **4. Optimize Image Delivery** | Added `width="1200"`, `height="800"`, and `srcSet` to the hero image tag. | LCP 4.8s, CLS 0.85 | LCP <2.0s, CLS 0.0 | Explicit dimensions prevent the browser from having to recalculate layout once the image loads (eliminating CLS). `srcSet` allows serving appropriately sized images for different viewports. |
| **5. Implement Code Splitting** | Used `React.lazy` and `Suspense` to lazily load `ArticleItem`. | Single large JS bundle | Multiple JS chunks generated | Splitting the code into smaller chunks allows the browser to load and parse only the JavaScript needed for the initial render, improving Time to Interactive (TTI). |


