const enhancer = require('index.js')

const deepFreeze      = require('deep-freeze')
const jsonpath        = require('jsonpath')
const { createStore } = require('redux')

require('@warren-bank/immutable-jsonpath')(jsonpath)

const initialState = {}
for (let height=1; height<=5; height++) {
  const char = String.fromCharCode( 'a'.charCodeAt(0) + height )
  let root = initialState

  for (let width=1; width<=5; width++) {
    let key = char.repeat(width)
    root[key] = {}
    root = root[key]
  }
}
deepFreeze(initialState)

const reducer = (state=initialState, action) => {
  switch (action.type) {

    case 'replace':
      let {path, value} = action.payload
      return jsonpath.assign(state, path, value)

    case 'reset':
      return action.payload.value

    default:
      return state
  }
}

describe('redux state Object is traversed by jsonpath', function() {
  let store
  let listener
  let unsubscribe

  beforeEach(() => {
    store    = enhancer(createStore)(reducer)
    listener = jest.fn()
  })

  afterEach(() => {
    if (typeof unsubscribe === "function") {
      unsubscribe()
      unsubscribe = undefined
    }
  })

  it('should not call listener when state is unchanged', function() {
    const paths = {
      listen:  '$.c.cc.ccc.cccc',
      replace: ''
    }

    // pass-through
    const action = {
      type: 'test'
    }

    unsubscribe = store.subscribe(listener, paths.listen)
    store.dispatch(action)

    expect(listener.mock.calls.length).toEqual(0)
  })

  it('should call listener when jsonpath exactly matches changed data in state', function() {
    const paths = {
      listen:  '$.c.cc.ccc.cccc',
      replace: '$.c.cc.ccc.cccc'
    }

    const action = {
      type: 'replace',
      payload: {
        path: paths.replace,
        value: {hello: 'world'}
      }
    }

    unsubscribe = store.subscribe(listener, paths.listen)
    store.dispatch(action)

    expect(listener.mock.calls.length).toEqual(1)
    expect(
      jsonpath.value(
        listener.mock.calls[0][0],
        paths.replace
      )).toBe(action.payload.value)
  })

  it('should call listener when jsonpath matches ancestor of changed data in state', function() {
    const paths = {
      listen:  '$.c.cc.ccc',
      replace: '$.c.cc.ccc.cccc'
    }

    const action = {
      type: 'replace',
      payload: {
        path: paths.replace,
        value: {hello: 'world'}
      }
    }

    unsubscribe = store.subscribe(listener, paths.listen)
    store.dispatch(action)

    expect(listener.mock.calls.length).toEqual(1)
    expect(
      jsonpath.value(
        listener.mock.calls[0][0],
        paths.replace
      )).toBe(action.payload.value)
  })

  it('should call listener when state is changed', function() {
    const paths = {
      listen:  '',
      replace: '$.c.cc.ccc.cccc'
    }

    const action = {
      type: 'replace',
      payload: {
        path: paths.replace,
        value: {hello: 'world'}
      }
    }

    unsubscribe = store.subscribe(listener, true)
    store.dispatch(action)

    expect(listener.mock.calls.length).toEqual(1)
    expect(
      jsonpath.value(
        listener.mock.calls[0][0],
        paths.replace
      )).toBe(action.payload.value)
  })

  it('should not call listener when jsonpath matches branch unrelated to changed data in state', function() {
    const paths = {
      listen:  '$.d',
      replace: '$.c.cc.ccc.cccc'
    }

    const action = {
      type: 'replace',
      payload: {
        path: paths.replace,
        value: {hello: 'world'}
      }
    }

    unsubscribe = store.subscribe(listener, paths.listen)
    store.dispatch(action)

    expect(listener.mock.calls.length).toEqual(0)
  })

  it('should call listener when jsonpath does not match the new state', function() { // value !== undefined
    const paths = {
      listen:  '$.c.cc.ccc.cccc',
      replace: ''
    }

    const action = {
      type: 'reset',
      payload: {
        value: {hello: 'world'}
      }
    }

    unsubscribe = store.subscribe(listener, paths.listen)
    store.dispatch(action)

    expect(listener.mock.calls.length).toEqual(1)
  })

  it('should not call listener when jsonpath does not match either the old or new state', function() { // undefined === undefined
    const paths = {
      listen:  '$.foo.bar',
      replace: ''
    }

    const action = {
      type: 'reset',
      payload: {
        value: {hello: 'world'}
      }
    }

    unsubscribe = store.subscribe(listener, paths.listen)
    store.dispatch(action)

    expect(listener.mock.calls.length).toEqual(0)
  })

  it('should throw an Error when the root reducer returns a non-Object state', function() {
    const paths = {
      listen:  '$',
      replace: ''
    }

    const action = {
      type: 'reset',
      payload: {
        value: 'hello world'
      }
    }

    unsubscribe = store.subscribe(listener, paths.listen)

    expect(() => {
      store.dispatch(action)
    }).toThrow()

    expect(listener.mock.calls.length).toEqual(0)
  })
})
