import type { FieldOption } from '../domain/types.js'

/**
 * Maps a raw API response array to FieldOption[].
 *
 * - valueKey / labelKey: which fields in each object become value / text
 * - If the object has a `data` key it is spread as the base of data
 * - All remaining fields (not valueKey, labelKey, tag, icon, color, position) are merged into data
 *
 * Examples (valueKey='uuid', labelKey='fullname'):
 *
 * Input:  [{ fullname:'Juan', uuid:'abc', active:true }]
 * Output: [{ value:'abc', text:'Juan', data:{ active:true }, ... }]
 *
 * Input:  [{ fullname:'Juan', uuid:'abc', active:true, data:{ country:'ve' } }]
 * Output: [{ value:'abc', text:'Juan', data:{ country:'ve', active:true }, ... }]
 */
export function normalizeApiResponse(
  items: Record<string, unknown>[],
  valueKey = 'value',
  labelKey = 'label',
): FieldOption[] {
  return items.map((item, index) => {
    const value = item[valueKey] as string | number
    const text = String(item[labelKey] ?? '')

    // Known FieldOption top-level fields that should not go into data
    const knownKeys = new Set([valueKey, labelKey, 'description', 'tag', 'icon', 'color', 'position', 'data', 'translations'])

    const existingData = (typeof item['data'] === 'object' && item['data'] !== null)
      ? (item['data'] as Record<string, unknown>)
      : {}

    const rest: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(item)) {
      if (!knownKeys.has(k)) rest[k] = v
    }

    const translations = (typeof item['translations'] === 'object' && item['translations'] !== null)
      ? (item['translations'] as FieldOption['translations'])
      : {}

    return {
      value,
      text,
      description: (item['description'] as string | null) ?? null,
      tag: (item['tag'] as string | null) ?? null,
      icon: (item['icon'] as string | null) ?? null,
      color: (item['color'] as string | null) ?? null,
      position: typeof item['position'] === 'number' ? item['position'] : index + 1,
      data: { ...existingData, ...rest },
      translations,
    }
  })
}
