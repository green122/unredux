import Axios from "axios"

// void -> Promise
let loadSkills = (state) => {
  let url = "http://localhost:8080/api/skills" // TODO
  return Axios.get(url)
    .then((response) => {
      return response.data
    })
    .catch(error => {
      console.log("Error: ", error)
    })
}

export default {
  loadSkills
}



