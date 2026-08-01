import { inertHtml as ih } from 'foldkit/html'

// ❌ Bad
const badDivider = ih.div([ih.Class('h-px bg-gray-200')], [])
const badSpacer = ih.keyed('li')('top-spacer', [ih.Role('presentation')], [])

// ✅ Good
const goodDivider = ih.div([ih.Class('h-px bg-gray-200')])
const goodSpacer = ih.keyed('li')('top-spacer', [ih.Role('presentation')])
