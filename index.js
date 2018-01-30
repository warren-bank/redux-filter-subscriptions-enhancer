const enhancer = next => (...args) => {
  const store = next(...args)

  let _action
  let _oldState

  const dispatch = action => {
    _action   = action
    _oldState = store.getState()

    store.dispatch(action)
  }

  const subscribe = (listener, filter) => {
    if (typeof filter !== 'function') {
      filter = filter === true ? pure_filter : false
    }

    const nextListener = () => {
      const _newState = store.getState()
      const apply_filter = filter && filter(_oldState, _newState)

      if (!apply_filter) {
        listener(_newState, _action)
      }
    }

    return store.subscribe(nextListener)
  }

  const pure_filter = (oldState, newState) => oldState === newState

  return {
    ...store,
    dispatch,
    subscribe
  }
}

module.exports = enhancer
