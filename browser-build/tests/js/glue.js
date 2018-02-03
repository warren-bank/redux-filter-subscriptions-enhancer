// ---------------------------

const jest = {}

jest.fn = () => {
  const spy = expect.createSpy()

  const wrapper = (...args) => {
    spy(...args)

    const index     = spy.calls.length - 1
    const arguments = spy.calls[index]["arguments"]
    spy.calls[index] = arguments
  }

  wrapper.mock = spy
  return wrapper
}

// ---------------------------

const require = path => {
  switch(path) {
    case "index.js":
      return window.redux_filter_subscriptions_enhancer
    case "redux":
      return window.Redux
    case "jsonpath":
      return window.jsonpath
    case "deep-freeze":
      return arg => arg
  }
}

// ---------------------------
