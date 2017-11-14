import * as R from "ramda"
import React from "react"
import {Observable as O} from "rxjs"
import * as F from "framework"
import * as D from "selfdb"
import {IS_CLIENT} from "../meta"

import Actions from "./actions"

export default (sources, key) => {

  let seeds = {
    skills: [],
    loading: false,
  }

  if (IS_CLIENT) {
    var intents = {
      // unsubscribed on state unsubscribe which happens on willUnmount
      refresh$: sources.DOM.fromKey("refresh").listen("click")
        .do(event => event.preventDefault())
        .mapTo(true)
    }

    var state$ = D.run(
      () => D.makeStore({}),
      D.withLog({key}),
      D.withMemoryPersistence({key}),
    )(O.merge(
      D.init(seeds),
      intents.refresh$
        .map(_ => R.set("loading", true)),
      intents.refresh$
        .concatMap(Actions.loadSkills)
        .map(data => R.pipe(
          R.set("skills", data),
          R.set("loading", false)
        )),
    )).$
  }
  else {
    var intents = {
      loadData$: new O(o => {
        Actions.loadSkills().then(data => {
          o.next(data)
          o.complete()
        })
      }),
    }

    var state$ = D.run(
      () => D.makeStore({}),
      // D.withLog({key}),
      // D.withMemoryPersistence({key}),
    )(O.merge(
      D.init(seeds),
      intents.loadData$
        .map(data => R.set("skills", data)),
    )).$
  }

  function Skills(props) {
    let {skills, loading} = props.state
    return <div>
      <h3>Skills</h3>
      <p>
        <button data-key="refresh">Refresh (request to API with latency)</button>
      </p>
      {loading
        ? <div>loading...</div>
        : skills && skills.length
          ? <SkillsList skills={skills}/>
          : <div>no skills</div>
      }
    </div>
  }

  let Component = F.connect(
    {state: state$},
    Skills
  )
  return {state$, Component}
}

function SkillsList({skills}) {
  return R.map(skill => <div key={skill.id}>{skill.title}</div>, skills)
}
