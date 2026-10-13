/** Prefix a /public asset path with the deploy basePath (e.g. GitHub Pages sub-path). */
export function assetPath(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}${path}`;
}
