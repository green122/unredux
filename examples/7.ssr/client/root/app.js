import * as R from "ramda"
import {Observable as O} from "rxjs"
import React from "react"
import * as D from "selfdb"
import * as F from "framework"
import router from "../router"
import {IS_CLIENT} from "../meta"

export default (sources, key, url) => {
  let contentSinks$ = F.derive(
    {url: sources.state$.pluck("url")},
    ({url}) => {
      let {mask, payload: app} = router.doroute(url)
      let sinks = F.isolate(app, key + mask.replace(/^\//, "."))({...sources, props: {router}})
      return R.merge({action$: O.of()}, sinks)
    }
  )

  let intents = {}
  if (IS_CLIENT) {
    intents = {
      navigateTo$: sources.DOM.from("a").listen("click")
        .do(event => event.preventDefault())
        .map(event => event.target.attributes.href.value)
        .do(url => {
          window.history.pushState({}, "", url)
        })
        .share(),

      navigateHistory$: O.fromEvent(window, "popstate")
        .map(data => document.location.pathname)
    }
  }

  let state$ = D.run(
    () => D.makeStore({}),
    D.withLog({key}),
  )(
    D.init({
      url: url,
    }),

    // navigation
    ...(IS_CLIENT ? [
      intents.navigateTo$.map(url => R.fn("navigateTo", R.set("url", url)))] : []
    ),
    ...(IS_CLIENT ? [
      intents.navigateHistory$.map(url => R.fn("navigateHistory", R.set("url", url)))
    ] : []),

    // content
    contentSinks$.pluck("action$").switch(),
  ).$

  let Component = F.connect(
    {
      url: state$.pluck("url"),
      Content: contentSinks$.pluck("Component"),
    },
    ({url, Content}) => {
      return <div>
        <p>
          Current URL: {url}
        </p>
        <p>
        <a href="/" className="link">Home</a>
        {" "}
        <a href="/skills" className="link">Skills</a>
        </p>
        <hr/>
        <Content/>
      </div>
    }
  )

  return {state$, Component}
}
