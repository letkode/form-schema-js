import { AbstractRender } from '../RenderDefinition.js'

export class AccordionSectionRender extends AbstractRender {
  getName() { return 'accordion' }
  override getDefaultMetadata() {
    return { allow_multiple_open: false, first_open: true }
  }
}
