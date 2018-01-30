const enhancer = require('index.js')

const { applyMiddleware, compose, createStore } = require('redux')

const increment_all = store => next => action => {
  // forward a new action
  action = {
    ...action,
    payload: action.payload + 1
  }
  next(action)
}

const debounce_odd = store => next => action => {
  // when payload is even: forward the action
  if (action.type === "test" && action.payload % 2 === 0) next(action)
}

const rootReducer  = (state, action) => (action.type === "test") ? action.payload : state
const initialState = 0

describe('path of dispatched action: enhancer -> middleware -> store', function() {
  let listener
  let unsubscribe

  beforeEach(() => {
    listener = jest.fn()
  })

  afterEach(() => {
    if (typeof unsubscribe === "function") {
      unsubscribe()
      unsubscribe = undefined
    }
  })

  it('middleware should debounce actions', function() {
    const middleware   = applyMiddleware(debounce_odd)
    const rootEnhancer = compose(enhancer, middleware)
    const store        = createStore(rootReducer, initialState, rootEnhancer)

    // no filter
    unsubscribe = store.subscribe(listener)

    let count = 5
    for (let i=1; i<=count; i++) {
      store.dispatch({type: "test", payload: i})
    }

    // "enhancer"  receives actions containing payload: [2,4]
    // redux store receives actions containing payload: [2,4]
    expect(listener.mock.calls.length).toEqual(2)
    expect(listener.mock.calls[0]).toEqual([2,{type: "test", payload: 2}])
    expect(listener.mock.calls[1]).toEqual([4,{type: "test", payload: 4}])
  })

  it('middleware should debounce and then increment actions', function() {
    const middleware   = applyMiddleware(debounce_odd, increment_all)
    const rootEnhancer = compose(enhancer, middleware)
    const store        = createStore(rootReducer, initialState, rootEnhancer)

    // no filter
    unsubscribe = store.subscribe(listener)

    let count = 5
    for (let i=1; i<=count; i++) {
      store.dispatch({type: "test", payload: i})
    }

    // "enhancer"  receives actions containing payload: [2,4]
    // redux store receives actions containing payload: [3,5]
    expect(listener.mock.calls.length).toEqual(2)
    expect(listener.mock.calls[0]).toEqual([3,{type: "test", payload: 2}])
    expect(listener.mock.calls[1]).toEqual([5,{type: "test", payload: 4}])
  })
})

describe('path of dispatched action: middleware -> enhancer -> store', function() {
  let listener
  let unsubscribe

  beforeEach(() => {
    listener = jest.fn()
  })

  afterEach(() => {
    if (typeof unsubscribe === "function") {
      unsubscribe()
      unsubscribe = undefined
    }
  })

  it('middleware should debounce actions', function() {
    const middleware   = applyMiddleware(debounce_odd)
    const rootEnhancer = compose(middleware, enhancer)
    const store        = createStore(rootReducer, initialState, rootEnhancer)

    // no filter
    unsubscribe = store.subscribe(listener)

    let count = 5
    for (let i=1; i<=count; i++) {
      store.dispatch({type: "test", payload: i})
    }

    // "enhancer"  receives actions containing payload: [2,4]
    // redux store receives actions containing payload: [2,4]
    expect(listener.mock.calls.length).toEqual(2)
    expect(listener.mock.calls[0]).toEqual([2,{type: "test", payload: 2}])
    expect(listener.mock.calls[1]).toEqual([4,{type: "test", payload: 4}])
  })

  it('middleware should debounce and then increment actions', function() {
    const middleware   = applyMiddleware(debounce_odd, increment_all)
    const rootEnhancer = compose(middleware, enhancer)
    const store        = createStore(rootReducer, initialState, rootEnhancer)

    // no filter
    unsubscribe = store.subscribe(listener)

    let count = 5
    for (let i=1; i<=count; i++) {
      store.dispatch({type: "test", payload: i})
    }

    // "enhancer"  receives actions containing payload: [3,5]
    // redux store receives actions containing payload: [3,5]
    expect(listener.mock.calls.length).toEqual(2)
    expect(listener.mock.calls[0]).toEqual([3,{type: "test", payload: 3}])
    expect(listener.mock.calls[1]).toEqual([5,{type: "test", payload: 5}])
  })
})
