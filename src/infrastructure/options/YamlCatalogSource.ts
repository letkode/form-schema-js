import { load } from 'js-yaml'
import type { FieldOption, RawOptionsSource, RawOptionsFile, ResolvedOptionsSource, ResolverExternalConfig } from '../../domain/types.js'

export interface OptionsSourceDefinition {
  getType(): string
  /** Catalog is always pre-loaded; repository and api support deferred loading */
  isAlwaysPreLoad(): boolean
  resolve(source: RawOptionsSource, config: ResolverExternalConfig): Promise<FieldOption[]>
  buildLazyOutput?(source: RawOptionsSource, config: ResolverExternalConfig): ResolvedOptionsSource
}

export class YamlCatalogSource implements OptionsSourceDefinition {
  getType() { return 'catalog' }
  isAlwaysPreLoad() { return true }

  private normalizeOptionTranslations(
    raw: Record<string, Partial<{ label: string; description: string }>> | undefined,
  ): Record<string, Partial<{ text: string; description: string }>> {
    if (!raw) return {}
    return Object.fromEntries(
      Object.entries(raw).map(([locale, t]) => {
        const entry: Partial<{ text: string; description: string }> = {}
        if (t.label !== undefined) entry.text = t.label
        if (t.description !== undefined) entry.description = t.description
        return [locale, entry]
      }),
    )
  }

  async resolve(source: RawOptionsSource, config: ResolverExternalConfig): Promise<FieldOption[]> {
    const url = `${config.yamlBaseUrl}/options/${source.tag}.yaml`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`[form-schema] Failed to load options catalog "${source.tag}" from ${url} (${response.status})`)
    }
    const text = await response.text()
    const raw = load(text) as RawOptionsFile

    return (raw.values ?? []).map((v, i) => {
      const t = v.translations?.[config.locale] ?? {}
      return {
        value: v.value,
        text: t.label ?? v.label,
        description: t.description ?? v.description ?? null,
        tag: v.tag ?? null,
        icon: v.icon ?? null,
        color: v.color ?? null,
        position: v.position ?? i + 1,
        data: v.data ?? {},
        translations: this.normalizeOptionTranslations(v.translations),
      }
    })
  }
}
