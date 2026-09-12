import type { Reroute } from "@sveltejs/kit";
// Existing bookmarks to /resume/index.html still resolve after hydration.
export const reroute: Reroute = ({ url }) => {
  if (url.pathname.endsWith("/index.html")) {
    return url.pathname.slice(0, -"index.html".length);
  }
  return undefined;
};
