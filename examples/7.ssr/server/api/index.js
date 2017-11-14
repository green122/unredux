import fs from "fs"
import express from "express"
import path from "path"

let router = express.Router()

router.get('/skills', (req, res) => {
  setTimeout(() => {
    return new Promise(function (resolve, reject) {
      let filename = path.join(__dirname, "./data/skills.json") // TODO
      let data = fs.readFileSync("./data/skills.json", {encoding: "utf8"})
      return resolve(JSON.parse(data).data)
    }).then((data) => {
      res.setHeader("Content-Type", "application/json")
      res.send(data)
    }).catch(error => { // TODO
      console.log('skills API error: ', error)
    })
  }, 1000)
})

export default router
