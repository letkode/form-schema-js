import type { FieldOption } from '../domain/types.js'

/**
 * Maps a raw API response array to FieldOption[].
 *
 * - valueKey / labelKey / descriptionKey: which fields in each object become value / label / description
 * - `translations[locale]` entries are remapped the same way (labelKey -> label, descriptionKey -> description)
 * - If the object has a `data` key it is spread as the base of data
 * - All remaining fields (not valueKey, labelKey, descriptionKey, tag, icon, color, position) are merged into data
 *
 * Examples (valueKey='uuid', labelKey='fullname'):
 *
 * Input:  [{ fullname:'Juan', uuid:'abc', active:true }]
 * Output: [{ value:'abc', label:'Juan', data:{ active:true }, ... }]
 *
 * Input:  [{ fullname:'Juan', uuid:'abc', active:true, data:{ country:'ve' } }]
 * Output: [{ value:'abc', label:'Juan', data:{ country:'ve', active:true }, ... }]
 */
export function normalizeApiResponse(
  items: Record<string, unknown>[],
  valueKey = 'value',
  labelKey = 'label',
  descriptionKey = 'description',
): FieldOption[] {
  return items.map((item, index) => {
    const value = item[valueKey] as string | number
    const label = String(item[labelKey] ?? '')

    // Known FieldOption top-level fields that should not go into data
    const knownKeys = new Set([valueKey, labelKey, descriptionKey, 'tag', 'icon', 'color', 'position', 'data', 'translations'])

    const existingData = (typeof item['data'] === 'object' && item['data'] !== null)
      ? (item['data'] as Record<string, unknown>)
      : {}

    const rest: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(item)) {
      if (!knownKeys.has(k)) rest[k] = v
    }

    const rawTranslations = (typeof item['translations'] === 'object' && item['translations'] !== null)
      ? (item['translations'] as Record<string, Record<string, unknown>>)
      : {}

    const translations: FieldOption['translations'] = Object.fromEntries(
      Object.entries(rawTranslations).map(([locale, t]) => {
        const entry: Partial<{ label: string; description: string }> = {}
        if (t[labelKey] !== undefined) entry.label = String(t[labelKey])
        if (t[descriptionKey] !== undefined) entry.description = String(t[descriptionKey])
        return [locale, entry]
      }),
    )

    return {
      value,
      label,
      description: (item[descriptionKey] as string | null) ?? null,
      tag: (item['tag'] as string | null) ?? null,
      icon: (item['icon'] as string | null) ?? null,
      color: (item['color'] as string | null) ?? null,
      position: typeof item['position'] === 'number' ? item['position'] : index + 1,
      data: { ...existingData, ...rest },
      translations,
    }
  })
}
