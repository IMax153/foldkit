---
'foldkit': minor
---

Let the `flags` Effect require services from the `resources` Layer.

`flags` was typed `Effect<Flags>`, so an app whose flags and Commands needed the same service had to discharge the requirement inside `flags` with `Effect.provide(flags, AppLayer)` and pass the same `AppLayer` again as `resources`. Effect memoizes a Layer per build, and those are two builds, so the app silently got two instances of whatever the Layer holds. For a stateless Layer that is invisible. For one holding a socket, a connection, a cache, or a `Ref`, half the app talked to one instance and half to the other.

`flags` now accepts `Effect<Flags, never, Resources>`, where `Resources` is what the `resources` Layer provides. The runtime resolves flags through the same cached build it gives Commands and Subscriptions, so the Layer is constructed once and shared. A requirement that `resources` does not provide is a compile error at the `makeApplication` and `makeElement` boundaries rather than a missing-service failure at runtime.

Existing call sites keep compiling unchanged: an `Effect<Flags>` requires nothing, and providing a Layer inside `flags` is still the right placement for a service used only at startup, such as `KeyValueStore` reading persisted state. Moving a shared Layer out of `flags` and into `resources` is what stops the second build, which is the point.

Flags resolve before `init`, so an app that declares them builds the `resources` Layer at startup rather than on its first Command, whether or not the flags Effect touches it. A Layer that fails to build during flag resolution has no Model to render a crash view against, so it surfaces as an unhandled defect; a Layer that fails later still gets the crash view.
