import { AbstractRender } from '../RenderDefinition.js'

export class FieldsetGroupRender extends AbstractRender {
  getName() { return 'fieldset' }
  override getDefaultMetadata() {
    return { legend: false, legend_custom: null }
  }
}
