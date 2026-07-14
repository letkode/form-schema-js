import { AbstractRender } from '../RenderDefinition.js'

/**
 * Generic group render for project-defined custom groups. The consuming app
 * dispatches on `render.metadata.key` to pick its own component.
 */
export class CustomGroupRender extends AbstractRender {
  getName() { return 'custom' }
}
