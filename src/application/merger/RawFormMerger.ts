import type { RawFormFile, RawSection, RawGroup, RawField } from '../../domain/types.js'

/**
 * Merges an overlay list onto a base list, matching items by `tag`.
 * Matched items are deep-merged via `mergeItem`; unmatched overlay items are appended.
 */
function mergeByTag<T extends { tag: string }>(
  base: T[],
  overlay: T[] | undefined,
  mergeItem: (base: T, overlay: T) => T,
): T[] {
  if (!overlay || overlay.length === 0) return base
  const result = base.map((b) => {
    const match = overlay.find((o) => o.tag === b.tag)
    return match ? mergeItem(b, match) : b
  })
  for (const o of overlay) {
    if (!base.some((b) => b.tag === o.tag)) result.push(o)
  }
  return result
}

function mergeTranslations<T>(
  base: Record<string, Partial<T>> | undefined,
  overlay: Record<string, Partial<T>> | undefined,
): Record<string, Partial<T>> | undefined {
  if (!overlay) return base
  const result: Record<string, Partial<T>> = { ...base }
  for (const [locale, value] of Object.entries(overlay)) {
    result[locale] = { ...result[locale], ...value }
  }
  return result
}

function mergeField(base: RawField, overlay: RawField): RawField {
  return {
    ...base,
    ...overlay,
    style: overlay.style !== undefined ? overlay.style : base.style,
    options: overlay.options !== undefined ? overlay.options : base.options,
    options_source: overlay.options_source
      ? { ...base.options_source, ...overlay.options_source }
      : base.options_source,
    attributes: overlay.attributes
      ? {
          ...base.attributes,
          ...overlay.attributes,
          unique: { ...base.attributes?.unique, ...overlay.attributes.unique },
          filter: { ...base.attributes?.filter, ...overlay.attributes.filter },
          actions: { ...base.attributes?.actions, ...overlay.attributes.actions },
        }
      : base.attributes,
    parameters: overlay.parameters
      ? {
          ...base.parameters,
          ...overlay.parameters,
          ...(Array.isArray(overlay.parameters.fields)
            ? {
                fields: mergeByTag(
                  (base.parameters?.fields as RawField[] | undefined) ?? [],
                  overlay.parameters.fields as RawField[],
                  mergeField,
                ),
              }
            : {}),
          ...(overlay.parameters.field && typeof overlay.parameters.field === 'object'
            ? {
                field: base.parameters?.field
                  ? mergeField(
                      base.parameters.field as RawField,
                      overlay.parameters.field as RawField,
                    )
                  : (overlay.parameters.field as RawField),
              }
            : {}),
        }
      : base.parameters,
    translations: mergeTranslations(base.translations, overlay.translations),
  }
}

function mergeGroup(base: RawGroup, overlay: RawGroup): RawGroup {
  return {
    ...base,
    ...overlay,
    render: overlay.render ? { ...base.render, ...overlay.render } : base.render,
    parameters: overlay.parameters ? { ...base.parameters, ...overlay.parameters } : base.parameters,
    translations: mergeTranslations(base.translations, overlay.translations),
    fields: mergeByTag(base.fields ?? [], overlay.fields, mergeField),
  }
}

function mergeSection(base: RawSection, overlay: RawSection): RawSection {
  return {
    ...base,
    ...overlay,
    render: overlay.render ? { ...base.render, ...overlay.render } : base.render,
    parameters: overlay.parameters ? { ...base.parameters, ...overlay.parameters } : base.parameters,
    translations: mergeTranslations(base.translations, overlay.translations),
    groups: mergeByTag(base.groups ?? [], overlay.groups, mergeGroup),
  }
}

/**
 * Deep-merges a scope overlay onto a base raw form file, matching sections, groups,
 * and fields (including collector `parameters.fields`) by `tag` at each level.
 *
 * - An overlay item whose `tag` matches a base item deep-merges onto it — only the
 *   leaves the overlay explicitly sets are overwritten, everything else is inherited.
 * - An overlay item with no matching `tag` in base is appended (new item for that scope).
 * - `style` and inline `options` are replaced wholesale when present on the overlay,
 *   never merged element by element.
 * - Setting `enabled: false` on an overlay item hides that item for the scope — this
 *   reuses the resolver's existing `enabled ?? true` filter, no separate "remove" flag.
 */
export function mergeRawForm(base: RawFormFile, overlay: RawFormFile): RawFormFile {
  return {
    ...base,
    ...overlay,
    render: overlay.render ? { ...base.render, ...overlay.render } : base.render,
    parameters: overlay.parameters ? { ...base.parameters, ...overlay.parameters } : base.parameters,
    translations: mergeTranslations(base.translations, overlay.translations),
    sections: mergeByTag(base.sections ?? [], overlay.sections, mergeSection),
  }
}
