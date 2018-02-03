### [redux-filter-subscriptions-enhancer](https://github.com/warren-bank/redux-filter-subscriptions-enhancer)

#### Overview:

* This project contains a Redux ["Store Enhancer"](https://github.com/reactjs/redux/blob/master/docs/Glossary.md#store-enhancer)
* Its purpose is two-fold:
  * `store.subscribe(listener, filter)`
    * adds a new (optional) input parameter: `filter`
      * its purpose is to conditionally filter when `listener` is called
      * when its value is:
        * `function`:
          * input: (oldState, newState)
          * output: boolean
            * when truthy, `listener` is not called for this _state_ change
        * `string`:
          * treated as a [jsonpath](https://github.com/dchester/jsonpath) pathExpression
            * precondition: _state_ must be an Object
              * will throw an Error when the root reducer returns a state that's not an Object
            * pathExpression uniquely defines the path to one specific data structure within the _state_ Object
          * `filter` looks up the value of this data structure in both `oldState` and `newState`
            * these values are compared for equality (by reference)
              * if equal, `listener` is not called for this _state_ change
        * `boolean`:
          * if `true`:
            * `oldState` and `newState` are compared for equality (by reference)
              * if equal, `listener` is not called for this _state_ change
                * note: this is optimized but functionally equivalent to the jsonpath pathExpression: "$"
        * `undefined` | `false` | any other value:
          * default behavior
            * `listener` is always called after the root reducer function completes processing a dispatched action
  * `listener(newState, action)`
    * passes information to the `listener`
      * `newState` is the same value returned by `store.getState()`
      * `action` is the value received by `store.dispatch()` that caused the reducer functions to change _state_
        * it's [debatable](https://github.com/reactjs/redux/issues/580) whether there's any reason a listener should ever use this value
        * it's officially considered by the Redux team to be an [anti-pattern](https://redux.js.org/docs/faq/DesignDecisions.html#does-not-pass-state-action-to-subscribers)
        * but..
          * one-size-fits-all rules don't work for every situation
          * there may be a valid reason to want this value
          * if a project is using middleware to debounce actions
            * it is the author's responsibility to be aware of this fact
        * imho..
          * better to have the data available without any reason to refer to it,<br>
            than to have the data unavailable and being in the rare situation that it is needed

#### Background:

* I submitted a [pull-request](https://github.com/reactjs/redux/pull/2814/files) to the Redux repo with a minimal patch to add the enhancement:
  * `store.subscribe(listener, filter)`
* It got turned down flat:
  * _"We have no plans to implement this. If you'd like to do it yourself, you can implement it as a store enhancer."_
* So.. I did, and here we are

#### Installation:

```bash
npm install --save '@warren-bank/redux-filter-subscriptions-enhancer'
```

#### Usage Example #1:

* This calling pattern allows the `middleware` enhancer to modify the base redux store before our enhancer
* The result is that calls to `store.dispatch(action)` pass through:
  * our enhancer
    * all middleware
      * base redux store
* The effect is that the action passed to `listener` has not been modified by `middleware`
  * in most cases, this would be undesirable
  * `listener` will most-likely want to receive the action exactly as it is received by the base redux store

```javascript
const { applyMiddleware, createStore } = require('redux')
const enhancer     = require('@warren-bank/redux-filter-subscriptions-enhancer')
const rootReducer  = (state, action) => (action.type === "test") ? state + 1 : state
const initialState = 0
const middleware   = applyMiddleware(logger, thunk, etc)
const store        = enhancer(createStore)(rootReducer, initialState, middleware)

const listener     = (newState, action) => console.log(JSON.stringify({newState, action}, null, 2))
const filter       = (oldState, newState) => newState % 2 !== 0

store.subscribe(listener, filter)
```

__rundown__:

* the `state` is an integer that is initialized to `0`, and its value increments by `1` every time a "test" action is dispatched to the store
* when `listener` is called, it logs its input parameters to the console as a serialized Object containing descriptive keys
* when `listener` subscribes to the store, it includes a `filter` function that will apply custom conditional logic to determine when `listener` should be called
  * in this case, `listener` wants to be informed each time the state changes to an even value

__reminder__:

* unlike the filter function for an Array, which returns true to __include__ values..
* this function will __block__ calls to `listener` when the filter function returns true

__to run tests containing code similar to usage example #1__:

* in node.js:
  * [unit tests w/ jest](https://github.com/warren-bank/redux-filter-subscriptions-enhancer/blob/master/tests/__tests__/1-filter-subscribe-listener.js)

```bash
git clone "https://github.com/warren-bank/redux-filter-subscriptions-enhancer.git"
cd "redux-filter-subscriptions-enhancer"

cd "browser-build"
npm install

cd "../tests"
npm install
npm run test
```

* in the web browser:
  * [same unit tests w/ mocha](https://cdn.rawgit.com/warren-bank/redux-filter-subscriptions-enhancer/master/browser-build/tests/1-filter-subscribe-listener.html)

#### Usage Example #2:

* This calling pattern is effectively identical to _usage example #1_
  * but it opens the door..

```javascript
const { applyMiddleware, compose, createStore } = require('redux')
const enhancer     = require('@warren-bank/redux-filter-subscriptions-enhancer')
const rootReducer  = (state, action) => (action.type === "test") ? state + 1 : state
const initialState = 0
const middleware   = applyMiddleware(logger, thunk, etc)
const rootEnhancer = compose(enhancer, middleware)
const store        = createStore(rootReducer, initialState, rootEnhancer)

const listener     = (newState, action) => console.log(JSON.stringify({newState, action}, null, 2))
const filter       = (oldState, newState) => newState % 2 !== 0

store.subscribe(listener, filter)
```

#### Usage Example #3:

* This calling pattern reverses the order, and allows our enhancer to receive dispatched actions __after__ they have been processed by `middleware`

```javascript
const { applyMiddleware, compose, createStore } = require('redux')
const enhancer     = require('@warren-bank/redux-filter-subscriptions-enhancer')
const rootReducer  = (state, action) => (action.type === "test") ? state + 1 : state
const initialState = 0
const middleware   = applyMiddleware(logger, thunk, etc)
const rootEnhancer = compose(middleware, enhancer)
const store        = createStore(rootReducer, initialState, rootEnhancer)

const listener     = (newState, action) => console.log(JSON.stringify({newState, action}, null, 2))
const filter       = (oldState, newState) => newState % 2 !== 0

store.subscribe(listener, filter)
```

__to run tests containing code similar to usage examples #2 and #3__:

* in node.js:
  * [unit tests w/ jest](https://github.com/warren-bank/redux-filter-subscriptions-enhancer/blob/master/tests/__tests__/2-middleware.js)

```bash
git clone "https://github.com/warren-bank/redux-filter-subscriptions-enhancer.git"
cd "redux-filter-subscriptions-enhancer"

cd "browser-build"
npm install

cd "../tests"
npm install
npm run test
```

* in the web browser:
  * [same unit tests w/ mocha](https://cdn.rawgit.com/warren-bank/redux-filter-subscriptions-enhancer/master/browser-build/tests/2-middleware.html)

#### Browser Build (transpiled to ES5):

* files in repo:
  * [minified javascript](https://github.com/warren-bank/redux-filter-subscriptions-enhancer/blob/master/browser-build/dist/enhancer.js)
  * [source map](https://github.com/warren-bank/redux-filter-subscriptions-enhancer/blob/master/browser-build/dist/enhancer.map)

* files hosted in CDN:
  * [minified javascript](https://cdn.rawgit.com/warren-bank/redux-filter-subscriptions-enhancer/master/browser-build/dist/enhancer.js)
  * [source map](https://cdn.rawgit.com/warren-bank/redux-filter-subscriptions-enhancer/master/browser-build/dist/enhancer.map)

* global variable(s):
  * window.redux_filter_subscriptions_enhancer

* conditional dependencies:
  * [jsonpath](https://github.com/dchester/jsonpath) is not bundled into the browser build
    * it was briefly in [v2.0.0](https://github.com/warren-bank/redux-filter-subscriptions-enhancer/releases/tag/v2.0.0)
      * the size increased from 1.06 KB (v1.0.0) to 164 KB (v2.0.0)
    * support for _jsonpath_ filters is now an optional feature
    * to enable this feature:
      * include the additional browser build script: [jsonpath](https://github.com/dchester/jsonpath/raw/1.0.0/jsonpath.min.js)
    * to use it:
      * call `store.subscribe(listener, filter)`
        * assign to `filter` a string value containing a well-formatted pathExpression
      * example:
        * [additional unit tests w/ mocha](https://cdn.rawgit.com/warren-bank/redux-filter-subscriptions-enhancer/master/browser-build/tests/3-jsonpath.html)

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
