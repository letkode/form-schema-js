import { AbstractRender } from '../RenderDefinition.js'

export class TabsSectionRender extends AbstractRender {
  getName() { return 'tabs' }
  override getDefaultMetadata() {
    return { orientation: 'horizontal', lazy_load: false }
  }
}
