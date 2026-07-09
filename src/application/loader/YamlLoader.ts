import { load } from 'js-yaml'
import type { RawFormFile } from '../../domain/types.js'

export class YamlLoader {
  static async loadForm(baseUrl: string, tag: string): Promise<RawFormFile> {
    const url = `${baseUrl}/forms/${tag}.yaml`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`[form-schema] Failed to load form "${tag}" from ${url} (${response.status})`)
    }
    const text = await response.text()
    return load(text) as RawFormFile
  }

  /**
   * Loads an optional scope overlay file (e.g. `{tag}.tenant.yaml`).
   * A 404 means "no overlay for this scope" and resolves to `null` rather than throwing —
   * other non-OK statuses still throw, since those indicate a real backend/config problem.
   *
   * Many static hosts (Vite's dev server, SPA rewrites on Netlify/Vercel, etc.) serve
   * `index.html` with a 200 status for unmatched paths instead of a real 404. That fallback
   * is HTML, not YAML, so it's detected via `content-type` and treated the same as a 404 —
   * otherwise the HTML would be parsed as an opaque YAML string scalar and silently merged in.
   */
  static async loadOverlay(baseUrl: string, tag: string, scope: string): Promise<RawFormFile | null> {
    const url = `${baseUrl}/forms/${tag}.${scope}.yaml`
    const response = await fetch(url)
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error(`[form-schema] Failed to load "${scope}" overlay for form "${tag}" from ${url} (${response.status})`)
    }
    const contentType = response.headers?.get?.('content-type') ?? ''
    if (contentType.includes('text/html')) {
      return null
    }
    const text = await response.text()
    const parsed = load(text)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }
    return parsed as RawFormFile
  }
}
