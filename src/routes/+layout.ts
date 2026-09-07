/*
 * Prerendered at build time, including the server render.
 *
 * `ssr = true` looks wrong for an app whose entire state lives in IndexedDB, and it is not about rendering data. Prerendering happens at build time with no user involved, so nothing personal is ever rendered anywhere: each route emits the shell it would show before the local database has loaded, plus its `<head>` — which is what a crawler or a WhatsApp link preview actually reads.
 *
 * Prerendering per route also gives the service worker a real file to precache for each path, so a direct hit on /shelf offline resolves to that route's own shell.
 *
 * The stores are inert outside the browser (see src/lib/db/index.ts), so a server render cannot touch IndexedDB even by accident.
 */
export const ssr = true;
export const prerender = true;
