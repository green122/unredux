import {ReplaySubject} from "rxjs"
import React from "react"
import ReactDOM from "react-dom"
import {APP_KEY} from "./meta"
import * as F from "framework"
import app from "./root/app"


let sources = {
  state$: new ReplaySubject(1),
  DOM: F.fromDOMEvent("#" + APP_KEY),
}

let sinks = app(sources, APP_KEY, document.location.pathname)

sinks.state$.subscribe(sources.state$)

ReactDOM.hydrate(<sinks.Component/>, document.getElementById(APP_KEY))
