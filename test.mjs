/**
 * Functional test for @letkode/form-schema
 * Mocks fetch to serve YAML files from the filesystem so the resolver
 * can be exercised without a running web server.
 */

import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const YAML_BASE = resolve(__dir, '../../../lka-react-ui-base/public/resources/form-schema')

// ---------------------------------------------------------------------------
// Mock fetch — maps URLs to filesystem reads
// ---------------------------------------------------------------------------

const BASE_URL = 'http://test.local/resources/form-schema'

globalThis.fetch = async (input) => {
  const url = String(input)
  if (!url.startsWith(BASE_URL)) {
    throw new Error(`Unexpected fetch URL: ${url}`)
  }
  const relativePath = url.slice(BASE_URL.length)
  const filePath = resolve(YAML_BASE, '.' + relativePath)

  try {
    const text = await readFile(filePath, 'utf8')
    return {
      ok: true,
      status: 200,
      text: async () => text,
    }
  } catch {
    return { ok: false, status: 404, text: async () => '' }
  }
}

// ---------------------------------------------------------------------------
// Import the built package
// ---------------------------------------------------------------------------

const { createFormSchemaResolver, FormSchemaRegistry, AbstractFieldType, AbstractRender } = await import('./dist/index.js')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`)
    passed++
  } else {
    console.error(`  ✗ ${message}`)
    failed++
  }
}

function section(title) {
  console.log(`\n── ${title} ──`)
}

// ---------------------------------------------------------------------------
// Test 1: Basic resolution
// ---------------------------------------------------------------------------

section('1. Basic resolution — user_profile form')

const resolver = createFormSchemaResolver({ baseUrl: BASE_URL })
const schema = await resolver.resolve('user_profile')

assert(schema.tag === 'user_profile', 'schema.tag is correct')
assert(schema.id === 'user_profile', 'schema.id defaults to tag')
assert(schema.locale === 'en', 'default locale is en')
assert(schema.enabled === true, 'form is enabled')
assert(Array.isArray(schema.sections), 'sections is an array')
assert(schema.sections.length > 0, 'has at least one section')
assert(schema.render.type === 'stepper', 'form render type is stepper')
assert(schema.render.metadata.show_progress === true, 'stepper metadata show_progress merged')
assert(schema.render.metadata.persist_on_navigate === true, 'stepper metadata persist_on_navigate merged')

// ---------------------------------------------------------------------------
// Test 2: Section / Group / Field structure
// ---------------------------------------------------------------------------

section('2. Section → Group → Field hierarchy')

const section1 = schema.sections[0]
assert(section1.tag === 'personal_data', 'first section tag is personal_data')
assert(section1.render.type === 'accordion', 'section render type is accordion')
assert(section1.render.metadata.allow_multiple_open === false, 'accordion metadata merged')
assert(section1.render.metadata.first_open === true, 'accordion first_open merged')
assert(Array.isArray(section1.groups), 'section has groups array')

const group1 = section1.groups[0]
assert(group1.tag === 'basic_info', 'first group tag is basic_info')
assert(group1.render.type === 'fieldset', 'group render type is fieldset')
assert(group1.render.metadata.legend === true, 'fieldset legend metadata merged')

const fields = group1.fields
assert(fields.length > 0, 'group has fields')

// ---------------------------------------------------------------------------
// Test 3: FieldType defaults merging
// ---------------------------------------------------------------------------

section('3. FieldType defaults merging')

const firstNameField = fields.find(f => f.tag === 'first_name')
assert(firstNameField !== undefined, 'first_name field exists')
assert(firstNameField.type === 'string', 'field type is string')
assert(firstNameField.parameters.label_style === 'default', 'string default label_style merged')
assert(firstNameField.parameters.max_length === 255, 'string default max_length is 255 (no override in YAML)')
assert(firstNameField.parameters.min_length === null, 'string default min_length is null')
assert(firstNameField.attributes.required === true, 'required set from YAML')
assert(firstNameField.attributes.readonly === false, 'readonly defaults to false')
assert(firstNameField.attributes.unique.enabled === false, 'unique defaults populated')
assert(firstNameField.attributes.filter.enabled === false, 'filter defaults populated')
assert(firstNameField.default_value === null, 'default_value is null')
assert(Array.isArray(firstNameField.style), 'style is array')
assert(firstNameField.style[0] === 'w-1/2', 'style contains w-1/2')

// ---------------------------------------------------------------------------
// Test 4: Options source (catalog YAML)
// ---------------------------------------------------------------------------

section('4. Options source — catalog resolution')

const countryField = fields.find(f => f.tag === 'country')
assert(countryField !== undefined, 'country field exists')
assert(countryField.type === 'select', 'country field type is select')
assert(Array.isArray(countryField.options), 'options is array')
assert(countryField.options.length > 0, 'options resolved from catalog')

const usOption = countryField.options.find(o => o.value === 'us')
assert(usOption !== undefined, 'US option exists')
assert(usOption.text === 'United States', 'option text is label from YAML')
assert(typeof usOption.data === 'object', 'option.data is object')
assert(usOption.data.country_code === 'US', 'option.data.country_code resolved')
assert(usOption.position === 1, 'option position resolved')
assert(usOption.tag === null, 'option tag defaults to null')
assert(usOption.icon === null, 'option icon defaults to null')
assert(usOption.color === null, 'option color defaults to null')

const esOption = countryField.options.find(o => o.value === 'es')
assert(esOption !== undefined, 'España option exists')
assert(esOption.text === 'España', 'Spanish option label correct')

// ---------------------------------------------------------------------------
// Test 5: Radio field with catalog options
// ---------------------------------------------------------------------------

section('5. Radio field with role catalog options')

const section2 = schema.sections.find(s => s.tag === 'account_settings')
assert(section2 !== undefined, 'account_settings section exists')

const permissionsGroup = section2.groups.find(g => g.tag === 'permissions')
assert(permissionsGroup !== undefined, 'permissions group exists')

const roleField = permissionsGroup.fields.find(f => f.tag === 'role')
assert(roleField !== undefined, 'role field exists')
assert(roleField.type === 'radio', 'role is radio type')
assert(roleField.parameters.layout === 'horizontal', 'layout param from YAML overrides vertical default')
assert(roleField.options.length === 3, 'role has 3 options from roles.yaml')
assert(roleField.options[0].value === 'admin', 'first role option is admin')
assert(roleField.options[0].icon === 'shield', 'admin option has icon')
assert(roleField.options[0].color === '#ef4444', 'admin option has color')

// ---------------------------------------------------------------------------
// Test 6: Switch field — formatDefaultValue
// ---------------------------------------------------------------------------

section('6. Switch field — formatDefaultValue')

const isActiveField = permissionsGroup.fields.find(f => f.tag === 'is_active')
assert(isActiveField !== undefined, 'is_active field exists')
assert(isActiveField.type === 'switch', 'is_active is switch type')
assert(isActiveField.default_value === true, 'switch default_value formatted to boolean true')

// ---------------------------------------------------------------------------
// Test 7: Locale translation — withLocale('es')
// ---------------------------------------------------------------------------

section('7. Locale translation — withLocale("es")')

const schemaEs = await resolver.withLocale('es').resolve('user_profile')
assert(schemaEs.locale === 'es', 'locale is es')
// Translation for section
const section1Es = schemaEs.sections[0]
assert(section1Es.name === 'Datos Personales', 'section name translated to Spanish')
// Translation for field
const group1Es = section1Es.groups[0]
const firstNameEs = group1Es.fields.find(f => f.tag === 'first_name')
assert(firstNameEs.name === 'Nombre', 'field name translated to Spanish')
assert(firstNameEs.placeholder === 'Ingresa tu nombre', 'field placeholder translated to Spanish')

// ---------------------------------------------------------------------------
// Test 8: Context overrides
// ---------------------------------------------------------------------------

section('8. Context overrides — withContext("show")')

const schemaShow = await resolver.withContext('show').resolve('user_profile')
const firstNameShow = schemaShow.sections[0].groups[0].fields.find(f => f.tag === 'first_name')
assert(firstNameShow.attributes.readonly === true, 'show context sets readonly: true')
assert(firstNameShow.attributes.required === true, 'show context does not change required (not overridden)')

section('8b. Context overrides — withContext("edit")')
const schemaEdit = await resolver.withContext('edit').resolve('user_profile')
const section2Edit = schemaEdit.sections.find(s => s.tag === 'account_settings')
const credGroup = section2Edit.groups.find(g => g.tag === 'credentials')
const passwordEdit = credGroup.fields.find(f => f.tag === 'password')
assert(passwordEdit.attributes.required === false, 'edit context sets password required: false')

// ---------------------------------------------------------------------------
// Test 9: Position sorting
// ---------------------------------------------------------------------------

section('9. Position sorting')

const positions = group1.fields.map(f => f.position)
const sorted = [...positions].sort((a, b) => a - b)
assert(JSON.stringify(positions) === JSON.stringify(sorted), 'fields sorted by position')

const sectionPositions = schema.sections.map(s => s.position)
const sectionsSorted = [...sectionPositions].sort((a, b) => a - b)
assert(JSON.stringify(sectionPositions) === JSON.stringify(sectionsSorted), 'sections sorted by position')

// ---------------------------------------------------------------------------
// Test 10: includingSections / excludingSections
// ---------------------------------------------------------------------------

section('10. includingSections / excludingSections')

const onlyPersonal = await resolver.includingSections(['personal_data']).resolve('user_profile')
assert(onlyPersonal.sections.length === 1, 'includingSections filters to 1 section')
assert(onlyPersonal.sections[0].tag === 'personal_data', 'included section is personal_data')

const withoutPersonal = await resolver.excludingSections(['personal_data']).resolve('user_profile')
assert(withoutPersonal.sections.length === 1, 'excludingSections removes personal_data')
assert(withoutPersonal.sections[0].tag === 'account_settings', 'remaining section is account_settings')

// ---------------------------------------------------------------------------
// Test 11: Immutability — chaining returns new instances
// ---------------------------------------------------------------------------

section('11. Immutability — chaining returns new instances')

const r1 = resolver.withLocale('en')
const r2 = r1.withLocale('es')
const s1 = await r1.resolve('user_profile')
const s2 = await r2.resolve('user_profile')
assert(s1.locale === 'en', 'original resolver locale not mutated')
assert(s2.locale === 'es', 'new resolver has es locale')

// ---------------------------------------------------------------------------
// Test 12: Unknown field type throws
// ---------------------------------------------------------------------------

section('12. Unknown field type throws UnknownFieldTypeError')

let threw = false
try {
  const badRegistry = new FormSchemaRegistry()
  // Inject a raw form with a bad field type by using a fake loader
  const badResolver = createFormSchemaResolver({ baseUrl: BASE_URL, registry: badRegistry })
  // Override fetch to return a form with an unknown field type
  const origFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => `
tag: test_form
name: Test
sections:
  - tag: s1
    name: S1
    position: 1
    groups:
      - tag: g1
        name: G1
        position: 1
        fields:
          - tag: f1
            name: F1
            type: unknown_type_xyz
            position: 1
`,
  })
  await badResolver.resolve('test_form')
  globalThis.fetch = origFetch
} catch (e) {
  threw = e.name === 'UnknownFieldTypeError'
  globalThis.fetch = async (input) => {
    const url = String(input)
    const relativePath = url.slice(BASE_URL.length)
    const filePath = resolve(YAML_BASE, '.' + relativePath)
    try {
      const text = await readFile(filePath, 'utf8')
      return { ok: true, status: 200, text: async () => text }
    } catch {
      return { ok: false, status: 404, text: async () => '' }
    }
  }
}
assert(threw, 'throws UnknownFieldTypeError for unknown field type')

// ---------------------------------------------------------------------------
// Test 13: Extensibility — custom FieldType
// ---------------------------------------------------------------------------

section('13. Extensibility — custom FieldType')

class ColorPickerFieldType extends AbstractFieldType {
  getName() { return 'color-picker' }
  takesOptions() { return false }
  getDefaultParameters() {
    return { label_style: 'default', format: 'hex', alpha: false }
  }
}

class CustomFormRender extends AbstractRender {
  getName() { return 'sidebar' }
  getDefaultMetadata() { return { width: 400, overlay: true } }
}

const customRegistry = new FormSchemaRegistry()
customRegistry.registerFieldType(new ColorPickerFieldType())
customRegistry.registerFormRender(new CustomFormRender())

const ft = customRegistry.getFieldType('color-picker')
assert(ft !== undefined, 'custom field type registered')
assert(ft.getName() === 'color-picker', 'custom field type getName works')
assert(ft.getDefaultParameters().format === 'hex', 'custom field type defaults returned')
assert(ft.takesOptions() === false, 'custom field type takesOptions works')

const render = customRegistry.getFormRender('sidebar')
assert(render !== undefined, 'custom render registered')
assert(render.getDefaultMetadata().width === 400, 'custom render metadata returned')

// built-ins still present after adding custom
const stringFt = customRegistry.getFieldType('string')
assert(stringFt !== undefined, 'built-in string still accessible after custom registration')

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed > 0) {
  console.error('SOME TESTS FAILED')
  process.exit(1)
} else {
  console.log('ALL TESTS PASSED ✓')
}
