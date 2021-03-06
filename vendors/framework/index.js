import React from "react"
import Route from "route-parser"
import {Observable as O, Subject} from "../rxjs"
import {combineLatestObj} from "rx-utils"
import * as R from "../ramda"
import uid from "uid-safe"

export let derive = (streamsToProps, mapFn) => {
  streamsToProps = R.map($ => $.distinctUntilChanged(R.identical), streamsToProps)
  return combineLatestObj(streamsToProps)
    .map(mapFn)
    .distinctUntilChanged(R.identical)
    .publishReplay(1)
    .refCount()
}

export let deriveOne = (stream, mapFn) => {
  stream = stream.distinctUntilChanged(R.identical)
  return stream
    .map(mapFn)
    .distinctUntilChanged(R.identical)
    .publishReplay(1)
    .refCount()
}

export let fromDOMEvent = (appSelector) => {
  function collectFn(selectors) {
    return {
      __selectors: selectors,
      from: (selector) => {
        return collectFn([...selectors, selector])
      },
      fromKey: (key) => {
        return collectFn([...selectors, `[data-key="${key}"]`])
      },
      listen: (eventName, options={}) => {
        return O.fromEvent(document.querySelector(appSelector), eventName, options)
          .throttleTime(10, undefined, {leading: true, trailing: true})
          .filter(event => {
            return event.target.matches(R.join(" ", selectors))
          })
          // .map(event => {
          //   if (event.target.dataset && event.target.dataset.val) {
          //     return event.target.dataset.val
          //   } else if (event.target.value) {
          //     return event.target.value
          //   } else {
          //     return event.target
          //   }
          // })
          .share()
      }
    }
  }
  return collectFn([appSelector])
}

export let connect = (streamsToProps, ComponentToWrap) => {
  class Container extends React.Component {
    constructor(props) {
      super(props)
      this.state = {}
      Container.constructor$.next()
      Container.constructor$.complete()
    }

    componentWillMount(...args) {
      let props$ = combineLatestObj(streamsToProps)
        .throttleTime(10, undefined, {leading: true, trailing: true})

      // TODO add .take(1) if called on server (because of no componentWillUnmount there)

      this.sb = props$.subscribe((data) => {
        this.setState(data)
      })
      Container.willMount$.next(args)
      Container.willMount$.complete()
    }

    componentWillUnmount(...args) {
      this.sb.unsubscribe()
      Container.willUnmount$.next(args)
      Container.willUnmount$.complete()
    }

    render() {
      // TODO async component (React-walk, etc.)
      if (R.isEmpty(this.state)) {
        return <div>Loading...</div>
      } else {
        return React.createElement(ComponentToWrap, R.merge(this.props, this.state), this.props.children)
      }
    }
  }

  Container.constructor$ = new Subject()
  Container.willMount$ = new Subject()
  Container.willUnmount$ = new Subject()

  return Container
}

export let lastKey = R.pipe(R.split("."), R.nth(-1))

// export let defaultSources = () => {
//   let state$ = new ReplaySubject(1)
//   let props = {}
//   let DOM = {
//     fromKey: () => DOM,
//     from: () => DOM,
//     listen: () => O.of(),
//   }
//   return {state$, props, DOM}
// }

export let isolateSources = {
  state$: (source, key) => source
    .pluck(lastKey(key))
    .distinctUntilChanged(R.identical),
    // .publishReplay(1)
    // .refCount(),

  props: R.always,

  DOM: (source, key) => source.fromKey(lastKey(key))
}

// export let defaultSinks = () => {
//   let action$ = O.of()
//   let state$ = O.of()
//   let DOM = (props) => null
//   return {action$, state$, DOM}
// }

export let isolateSinks = {
  action$: (sink, key) => {
    return sink.map(command => {
      return {fn: R.over, args: [lastKey(key), command]}
    })
  },

  state$: R.id, // has to be isolated manually

  intents: R.id, // has to be isolated manually

  Component: (sink, key) => {
    return (props) => <div data-key={lastKey(key)}>
      {React.createElement(sink, props)}
    </div>
  },
}

export let isolate = (app, appKey=null, types=null) => {
  appKey = appKey || uid.sync(4)
  return function App(sources) {
    // Prepare sources
    let isolatedSources = R.mapObjIndexed(
      (source, type) => !types || R.contains(type, types)
        ? isolateSources[type](source, appKey)
        : source,
      sources
    )
    let properSources = R.merge({} /*defaultSources()*/, isolatedSources)

    // Run app (unredux component)
    let sinks = app(properSources, appKey)

    // Prepare sinks
    let isolatedSinks = R.mapObjIndexed(
      (sink, type) => !types || R.contains(type, types)
        ? isolateSinks[type](sink, appKey)
        : sink,
      sinks
    )
    let properSinks = R.merge({} /*defaultSinks()*/, isolatedSinks)

    return properSinks
  }
}

// function isolateSingle(busKey, app, appKey=null) {
//   appKey = appKey || uid.sync(4)
//   return function App(sources) {
//     // Prepare sources
//     let isolatedSources = R.mapObjIndexed(
//       (source, sourceKey) => {
//         return sourceKey == busKey
//           ? templates[busKey].isolateSource(source, appKey)
//           : source
//       },
//       sources
//     )
//     let properSources = R.merge(defaultSources(), isolatedSources)
//
//     // Run app (unredux component)
//     let sinks = app(properSources, appKey)
//
//     // Prepare sinks
//     let isolatedSinks = R.mapObjIndexed(
//       (sink, sinkKey) => {
//         return sinkKey == busKey
//           ? templates[sinkKey].isolateSink(sink, appKey)
//           : sink
//       },
//       sinks
//     )
//     let properSinks = R.merge(defaultSinks(), isolatedSinks)
//
//     return properSinks
//   }
// }

/*export let liftSinks = (sinks) => {
  return R.merge(defaultSinks(), sinks)
}*/

export let lift = (Component) => {
  return (sources) => ({
    Component: Component,
  })
}

export let withLifecycle = (fn) => {
  return R.withName(fn.name, (sources, key) => {
    sources = R.merge(sources, {
      Component: {
        willMount$: new Subject(),
        willUnmount$: new Subject(),
      }
    })
    let sinks = fn(sources, key)
    if (sinks.Component) {
      if (sinks.Component.willMount$) {
        // Should unsubscribe automatically, reinforce with take(1)
        sinks.Component.willMount$.take(1).subscribe(sources.Component.willMount$)
      }
      if (sinks.Component.willUnmount$) {
        // Should unsubscribe automatically, reinforce with take(1)
        sinks.Component.willUnmount$.take(1).subscribe(sources.Component.willUnmount$)
      }
    }
    return sinks
  })
}

let inspect = (d) => R.is(String, d) ? `'${d}'` : d

// type Routes = Array (String, Payload)

// makeRouter :: Routes -> {doroute :: Function, unroute :: Function}
export let makeRouter = (routes) => {
  routes = R.map(
    ([mask, payload]) => [new Route(mask), payload],
    routes
  )

  // doroute :: String -> {mask :: String, params :: Object, payload :: any)
  let doroute = (url) => {
    for (let [route, payload] of routes) {
      let match = route.match(url)
      if (match) {
        return {mask: route.spec, params: match, payload}
      }
    }
    throw Error(`${inspect(url)} does not match any known route`)
  }

  // unroute :: (String, Params) -> String
  let unroute = (mask, params) => {
    for (let [route, payload] of routes) {
      if (route.spec == mask) {
        return route.reverse(params)
      }
    }
    throw Error(`${inspect(mask)} does not match any known route`)
  }

  return {doroute, unroute}
}
