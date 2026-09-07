/*
 * Stated per page rather than inherited, even though the root layout already prerenders every route. These two content pages are the ones a stranger reads first — from a link somebody sent them — and they must render as plain HTML with no JavaScript and no round trip. Saying so here means a later change to the root layout's default cannot quietly take that away.
 */
export const ssr = true;
export const prerender = true;
