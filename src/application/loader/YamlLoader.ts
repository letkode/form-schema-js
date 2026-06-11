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
}
