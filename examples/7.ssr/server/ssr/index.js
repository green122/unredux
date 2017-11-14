import express from "express"
import * as F from "framework"
import React from "react"
import ReactDOMServer from "react-dom/server"
import {ReplaySubject} from "rxjs"

import app from "../../client/root/app"
import {APP_KEY} from "../../client/meta"
import layout from "./layout"

let router = express.Router()

router.get('/*', (req, res) => { // TODO this will catch all!
  let url = req.originalUrl

  // TODO: should it be here? or how to pass url?
  let sources = {
    state$: new ReplaySubject(1),
    DOM: F.fromDOMEvent("#" + APP_KEY),
  }

  let sinks = app(sources, APP_KEY, url)

  sinks.state$.subscribe(sources.state$)

  let appHTML = ReactDOMServer.renderToString(<sinks.Component/>)
  // TODO: how to get current state and pass it to window object?
  res.send(layout({appHTML}))
})

export default router
