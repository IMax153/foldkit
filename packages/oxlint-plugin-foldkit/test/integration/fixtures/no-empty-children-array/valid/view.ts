import type { Html, HtmlBuilder } from 'foldkit/html'

import type { Message } from './message'

export const divider = (h: HtmlBuilder<Message>): Html =>
  h.div([h.Class('h-px bg-gray-200')])

export const banner = (h: HtmlBuilder<Message>): Html =>
  h.div([h.Class('p-4')], [h.span([h.Class('font-medium')], ['Heads up'])])

export const logo = (h: HtmlBuilder<Message>): Html =>
  h.img([h.Src('logo.png'), h.Alt('Logo')])
