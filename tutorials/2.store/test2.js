import * as R from "ramda"
import {inspect} from "util"
import {Observable as O} from "rxjs"

// Lib ===========================================================================================
// We can inject `seed` via `options` or `action$`. The second one is preferable because the "later"
// arguments are easier to wrap (and substitute) with middlewares, as you'll see later.
function makeStore(options) {
  return function Store(action$) {
    options = R.merge(makeStore.options, options)

    let self = {options} // no OOP

    self.$ = action$
      .scan((state, fn) => {
        if (R.is(Function, fn)) {
          return fn(state)
        } else {
          throw Error(`dispatched value must be a function, got ${inspect(fn)}`)
        }
      }, null)
      .distinctUntilChanged()
      .publishReplay(1)
      .refCount()

    return self
  }
}

// Discoverability (and debuggability) are even more important than testability!
// Why noone teaches them?!
makeStore.options = {
  cmpFn: R.identical,
}

// App =============================================================================================
let action$ = O.of(R.inc, R.inc, R.inc, R.inc, R.inc)
  .concatMap(x => O.of(x).delay(200))

let state1 = makeStore({})(action$.startWith(() => 1))

state1.$.subscribe(s => {
  console.log("state1:", s)
})

setTimeout(() => {
  let state10 = makeStore({})(action$.startWith(() => 10))

  state10.$.subscribe(s => {
    console.log("state10:", s)
  })
}, 1200)

// Next: we want to log state inputs and outputs...
