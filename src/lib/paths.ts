/** Resolve public assets without baking Domus paths into component templates. */
export const asset = (path: string): string => {
  const server = typeof document === "undefined";
  const base = server
    ? (process.env.BASE_PATH ?? "/~bergenwb")
    : (document.documentElement.dataset.base ?? "");
  const assets = server
    ? (process.env.ASSET_PATH ?? `${base}/_app`)
    : (document.documentElement.dataset.assets ?? `${base}/_app`);
  const relative = path.replace(/^\//, "");
  return relative.startsWith("_app/") ? `${assets}/${relative.slice(5)}` : `${base}/${relative}`;
};
