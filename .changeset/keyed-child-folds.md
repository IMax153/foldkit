---
'foldkit': minor
---

`Update.foldChildAt` folds one Submodel selected by key. It leaves the parent Model unchanged when `readAt` returns `None` for that key. For child OutMessages, `foldOutMessage` takes the key and returns a matcher whose handlers produce parent Steps. `toParentOutMessage` takes the key and returns a matcher that can forward a child OutMessage.

The example below stores Applicant Submodels in an array. Each Submodel has a stable entry ID that `foldChildAt` uses as its key.

**Before (`foldChild`):** Create a fold that closes over each entry's key.

```ts
const foldApplicant = (entryId: string) =>
  Update.foldChild({
    update: Applicant.update,
    read: (model: Model) =>
      Option.map(
        Array.findFirst(
          model.applicants,
          applicant => applicant.id === entryId,
        ),
        applicant => applicant.entry,
      ),
    write: (model, nextEntry) =>
      modifyFields(model, {
        applicants: Array.map(applicant =>
          applicant.id === entryId
            ? modifyFields(applicant, { entry: () => nextEntry })
            : applicant,
        ),
      }),
    toParentMessage: message =>
      Message.GotApplicantMessage({ entryId, message }),
  })

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotApplicantMessage: ({ entryId, message }) =>
      foldApplicant(entryId)(model, message),
  })
```

**After (`foldChildAt`):** Define one fold and pass the entry key to it. The fold supplies that key to `readAt`, `writeAt`, and `toParentMessage`.

```ts
const foldApplicant = Update.foldChildAt({
  update: Applicant.update,
  readAt: (model: Model, entryId: string) =>
    Option.map(
      Array.findFirst(model.applicants, applicant => applicant.id === entryId),
      applicant => applicant.entry,
    ),
  writeAt: (model, entryId, nextEntry) =>
    modifyFields(model, {
      applicants: Array.map(applicant =>
        applicant.id === entryId
          ? modifyFields(applicant, { entry: () => nextEntry })
          : applicant,
      ),
    }),
  toParentMessage: (entryId, message) =>
    Message.GotApplicantMessage({ entryId, message }),
})

const update = (model: Model, message: Message) =>
  Message.match<Update.Return<Model, Message>>(message, {
    GotApplicantMessage: ({ entryId, message }) =>
      foldApplicant(model, entryId, message),
  })
```
