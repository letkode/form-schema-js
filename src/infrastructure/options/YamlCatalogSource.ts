import { load } from 'js-yaml'
import type { FieldOption, RawOptionsFile } from '../../domain/types.js'

export interface OptionsSourceDefinition {
  getType(): string
  resolve(tag: string, baseUrl: string): Promise<FieldOption[]>
}

export class YamlCatalogSource implements OptionsSourceDefinition {
  getType() { return 'catalog' }

  async resolve(tag: string, baseUrl: string): Promise<FieldOption[]> {
    const url = `${baseUrl}/options/${tag}.yaml`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`[form-schema] Failed to load options catalog "${tag}" from ${url} (${response.status})`)
    }
    const text = await response.text()
    const raw = load(text) as RawOptionsFile

    return (raw.values ?? []).map((v, i) => ({
      value: v.value,
      text: v.label,
      tag: v.tag ?? null,
      icon: v.icon ?? null,
      color: v.color ?? null,
      position: v.position ?? i + 1,
      data: v.data ?? {},
    }))
  }
}
