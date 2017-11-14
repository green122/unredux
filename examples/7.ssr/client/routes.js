import * as R from "ramda"
import Route from "route-parser"
import React from "react"
import Home from "./root/Home"
import NotFound from "./root/NotFound"
import skillsApp from "./skills/app"

let homeApp = () => ({
  Component: Home,
})

let notFoundApp = () => ({
  Component: NotFound,
})

let routes = [
  ["/",       homeApp],
  ["/skills", skillsApp],
  ["/*path",  notFoundApp],
]

export default R.map(
  ([mask, payload]) => [new Route(mask), payload],
  routes
)
