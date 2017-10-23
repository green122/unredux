import * as R from "ramda"
import {Atom, logging} from "unredux"
import connect from "./connect"

let meta = logging({
  addTodo: (text, state) => {
    let id = String(R.values(state.todos).length + 1)
    return R.set(["todos", id], {
      id,
      text,
      completed: false,
      addedAt: new Date().toISOString(),
    }, state)
  },

  toggleTodo: (id, state) =>
    R.over(["todos", id, "completed"], x => !x, state),

  setFilter: (id, state) =>
    R.set(["filter"], filter, state),
})

let state = Atom({
  todos: {
    "1": {
      id: "1",
      text: "Write a TODO",
      completed: false,
      addedAt: new Date().toISOString(),
    }
  },
  filter: "all",
})

// Derived state should act like normal (instead of some memoized shit), so you can
// depend on it in actions (unlike so in Redux!)
let filteredTodos = state.derive([]).map((state) => {
    switch (state.filter) {
      case "all":
        return R.values(state.todos)
      case "completed":
        return R.sort(R.ascend(R.prop("addedAt")), R.filter(t => t.completed, R.values(state.todos)))
      case "active":
        return R.sort(R.ascend(R.prop("addedAt")), R.filter(t => !t.completed, R.values(state.todos)))
      default:
        throw Error("Unknown filter: " + state.filter)
    }
  }).distinctUntilChanged().shareReplay(1),

// Components ======================================================================================
let AddTodo = (props) => {
  let input
  return <div>
    <form onSubmit={e => {
      e.preventDefault()
      if (!input.value.trim()) {
        return
      }
      actions.addTodo(input.value)
      input.value = ""
    }}>
      <input ref={node => {
        input = node
      }} />
      <button type="submit">
        Add Todo
      </button>
    </form>
  </div>
}

let TodoItem = (props) =>
  <li
    onClick={() => actions.toggleTodo(props.todo.id)}
    style={{textDecoration: props.todo.completed ? "line-through" : "none"}}
  >
    {props.todo.text}
  </li>

let TodoList = connect(
  {todos: derived.filteredTodos},
  (props) =>
    <ul>
      {props.todos.map(todo =>
        <TodoItem key={todo.id} todo={todo}/>
      )}
    </ul>
)

let Footer = (props) =>
  <p>
    Show:
    {" "}
    <a id="all" href="#all" onClick={(e) => { e.preventDefault(); actions.setFilter("all"); }}>
      All
    </a>
    {", "}
    <a id="active" href="#active" onClick={(e) => { e.preventDefault(); actions.setFilter("active"); }}>
      Active
    </a>
    {", "}
    <a id="completed" href="#completed" onClick={(e) => { e.preventDefault(); actions.setFilter("completed"); }}>
      Completed
    </a>
  </p>

let App = (props) =>
  <div>
    <AddTodo/>
    <TodoList/>
    <Footer/>
  </div>

ReactDOM.render(<App/>, document.getElementById("root"))