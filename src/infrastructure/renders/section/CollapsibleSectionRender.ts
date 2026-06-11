import { AbstractRender } from '../RenderDefinition.js'

export class CollapsibleSectionRender extends AbstractRender {
  getName() { return 'collapsible' }
  override getDefaultMetadata() {
    return { default_collapsed: false }
  }
}
