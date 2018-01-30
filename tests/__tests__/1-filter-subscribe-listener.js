const enhancer = require('index.js')

const { createStore } = require('redux')

describe('redux state does not change', function() {
  const reducer = (state, action) => state
  const initialState = 0

  let store
  let listener
  let unsubscribe

  beforeEach(() => {
    store    = enhancer(createStore)(reducer, initialState)
    listener = jest.fn()
  })

  afterEach(() => {
    if (typeof unsubscribe === "function") {
      unsubscribe()
      unsubscribe = undefined
    }
  })

  it('should always call listener', function() {
    unsubscribe = store.subscribe(listener)

    let count = 5
    for (let i=1; i<=count; i++) {
      store.dispatch({type: "test", payload: i})
    }

    expect(listener.mock.calls.length).toEqual(5) // actions containing payload: [1,2,3,4,5]
    expect(listener.mock.calls[0]).toEqual([0,{type: "test", payload: 1}])
    expect(listener.mock.calls[1]).toEqual([0,{type: "test", payload: 2}])
    expect(listener.mock.calls[2]).toEqual([0,{type: "test", payload: 3}])
    expect(listener.mock.calls[3]).toEqual([0,{type: "test", payload: 4}])
    expect(listener.mock.calls[4]).toEqual([0,{type: "test", payload: 5}])
  })

  it('should never call listener', function() {
    unsubscribe = store.subscribe(listener, true)

    let count = 5
    for (let i=1; i<=count; i++) {
      store.dispatch({type: "test", payload: i})
    }

    expect(listener.mock.calls.length).toEqual(0)
  })
})

describe('redux state increments by 1', function() {
  const reducer = (state, action) => (action.type === "test") ? state + 1 : state
  const initialState = 0

  let store
  let listener
  let unsubscribe

  beforeEach(() => {
    store    = enhancer(createStore)(reducer, initialState)
    listener = jest.fn()
  })

  afterEach(() => {
    if (typeof unsubscribe === "function") {
      unsubscribe()
      unsubscribe = undefined
    }
  })

  it('should only call listener when new state value is even', function() {
    unsubscribe = store.subscribe(listener, (oldState, newState) => newState % 2 !== 0)

    let count = 5
    for (let i=1; i<=count; i++) {
      store.dispatch({type: "test", payload: i})
    }

    expect(listener.mock.calls.length).toEqual(2) // new state values: [2,4]
    expect(listener.mock.calls[0][0]).toBe(2)
    expect(listener.mock.calls[1][0]).toBe(4)
  })
})
