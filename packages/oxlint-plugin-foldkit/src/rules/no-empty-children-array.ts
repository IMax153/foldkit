import { Effect, Option } from 'effect'
import { Diagnostic, type ESTree, Rule, RuleContext } from 'effect-oxlint'

import {
  isArrayExpression,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
} from '../guards.ts'

// The two builder bindings Foldkit views use: the `h` a view receives and the
// `ih` that `inertHtml` is imported as. Matching on them keeps the rule off
// unrelated calls that happen to end in an empty array.
const BUILDER_BINDINGS: ReadonlySet<string> = new Set(['h', 'ih'])

const ELEMENT_TAG_PATTERN = /^[a-z][a-zA-Z0-9]*$/

const builderProperty = (callee: unknown): Option.Option<string> => {
  if (!isMemberExpression(callee) || callee.computed === true) {
    return Option.none()
  }
  if (
    !isIdentifier(callee.object) ||
    !BUILDER_BINDINGS.has(callee.object.name) ||
    !isIdentifier(callee.property)
  ) {
    return Option.none()
  }
  return Option.some(`${callee.object.name}.${callee.property.name}`)
}

// `h.div(attributes, children)`. The children slot is the second argument.
const elementCallTarget = (
  node: ESTree.CallExpression,
): Option.Option<string> =>
  node.arguments.length === 2
    ? Option.filter(
        builderProperty(node.callee),
        path => path !== 'h.keyed' && path !== 'ih.keyed',
      ).pipe(
        Option.filter(path =>
          ELEMENT_TAG_PATTERN.test(path.slice(path.indexOf('.') + 1)),
        ),
        Option.map(path => `${path}([...])`),
      )
    : Option.none()

// `h.keyed(tag)(key, attributes, children)`. The tag application is the callee,
// so the children slot is the outer call's third argument.
const keyedCallTarget = (
  node: ESTree.CallExpression,
): Option.Option<string> => {
  if (node.arguments.length !== 3 || !isCallExpression(node.callee)) {
    return Option.none()
  }
  return builderProperty(node.callee.callee).pipe(
    Option.filter(path => path === 'h.keyed' || path === 'ih.keyed'),
    Option.map(path => `${path}(tag)(key, [...])`),
  )
}

const childrenArgument = (node: ESTree.CallExpression): unknown =>
  node.arguments[node.arguments.length - 1]

const emptyChildrenMessage = (target: string): string =>
  `Omit the children argument when an element has none. Write ${target} instead of passing a trailing []. The builder defaults children to an empty array, so the two build the same vnode and the [] carries no information.`

/** Flags builder calls that pass an inline empty array as children, both `h.div([...], [])` and `h.keyed(tag)(key, [...], [])`. The children argument is optional on both, so an element with no children should omit it rather than spell out `[]`. */
export const noEmptyChildrenArray = Rule.define({
  name: 'no-empty-children-array',
  meta: Rule.meta({
    type: 'suggestion',
    description:
      'Omit the children argument on elements that have no children.',
  }),
  create: function* () {
    const ctx = yield* RuleContext
    return {
      CallExpression: (node: ESTree.Node) => {
        if (!isCallExpression(node)) {
          return Effect.void
        }
        const maybeTarget = Option.orElse(elementCallTarget(node), () =>
          keyedCallTarget(node),
        )
        if (Option.isNone(maybeTarget)) {
          return Effect.void
        }
        const children = childrenArgument(node)
        if (!isArrayExpression(children) || children.elements.length > 0) {
          return Effect.void
        }
        return ctx.report(
          Diagnostic.make({
            node,
            message: emptyChildrenMessage(maybeTarget.value),
          }),
        )
      },
    }
  },
})
