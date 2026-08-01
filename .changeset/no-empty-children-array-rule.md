---
'@foldkit/oxlint-plugin': minor
---

Adds `foldkit/no-empty-children-array`, which flags a builder call that passes an inline empty array as children. The argument is optional, so `h.div([h.Class('divider')], [])` should be written `h.div([h.Class('divider')])`, and `h.keyed('li')(key, [attrs], [])` should be written `h.keyed('li')(key, [attrs])`. Void elements and calls that pass a variable, a call, a conditional, or a non-empty array are left alone.
