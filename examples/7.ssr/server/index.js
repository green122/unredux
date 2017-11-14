import express from "express"
import apiRoutes from "./api"
import appRoutes from "./ssr"

let app = express()

// STATIC
app.use(express.static("public"))

// API
app.use("/api", apiRoutes)

// APP
app.use("/", appRoutes) // This will catch all now!

// ERROR HANDLERS
app.use(function(req, res, next) {
  res.status(404).send("404")
})
app.use(function(err, req, res, next) {
  console.error(err.stack)
  res.status(500).send("500")
})

app.set("port", process.env.PORT || 8080)
app.listen(8080, function () {
  console.log("App is listening on port 8080!")
})
