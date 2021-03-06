const JSDOM = require("jsdom").JSDOM;
const App = require('treehouse/lib/App')
const React = require('react')
const ReactDOM = require('react-dom')
const connector = require('../lib').connector

describe("Component", () => {

  const html = id => global.document.getElementById(id).innerHTML

  const render = (component) => {
    let element = global.window.document.getElementById('test')
    return ReactDOM.render(component, element)
  }

  let app

  beforeEach(() => {
    global.window = (new JSDOM('<!doctype html><html><body><div id="test"></div></body></html>')).window
    global.document = global.window.document
    app = new App()
  })

  describe("rendering", () => {

    let Widget,
      widgetRenderCount,
      WrappedWidget

    beforeEach(() => {
      widgetRenderCount = 0
      Widget = connector(app, {
        pick: t => ({
          theFruit: t.at('fruit')
        }),
        component: ({theFruit}) => {
          widgetRenderCount++
          return <div id="widget">{theFruit}</div>
        },
      })
    })

    it("renders from the tree", () => {
      app.init({fruit: 'orange', animal: 'sheep'})
      render(<Widget />)
      expect(html('widget')).toEqual('orange')
    })

    describe("using props", () => {

      beforeEach(() => {
        Widget = connector(app, {
          pick: t => ({
            a: t.at('a'),
            b: t.at('b')
          }),
          component: ({a, b, c}) => <div id="alphabet">{[a,b,c].join(',')}</div>,
        })
      })

      it("merges props, giving priority to passed in ones", () => {
        app.init({a: 'AYE', b: 'BEE'})
        render(<Widget b="beta" c="gamma" />)
        expect(html('alphabet')).toEqual('AYE,beta,gamma')
      })
    })

    describe("updating", () => {

      beforeEach(() => {
        app.init({fruit: 'orange', animal: 'sheep'})
        render(<Widget/>)
        widgetRenderCount = 0
      })

      it("updates when the relevant branch has been touched", () => {
        app.tree.push({path: ['fruit'], value: 'apple', channels: ['fruit']})
        app.commitChanges()
        expect(html('widget')).toEqual('apple')
        expect(widgetRenderCount).toEqual(1)
      })

      it("doesn't update when the relevant branch hasn't been touched", () => {
        app.tree.push({path: ['animal'], value: 'sloth', channels: ['animal']})
        app.commitChanges()
        expect(html('widget')).toEqual('orange')
        expect(widgetRenderCount).toEqual(0)
      })

      it("doesn't call render if the state from tree is the same", () => {
        app.tree.push({path: ['fruit'], value: 'orange', channels: ['fruit']})
        app.commitChanges()
        expect(html('widget')).toEqual('orange')
        expect(widgetRenderCount).toEqual(0)
      })

    })

    describe("parent-child relationships", () => {

      let Container, containerRenderCount

      beforeEach(() => {
        Container = connector(app, {
          pick: t => ({
            fruit: t.at(['fruit'])
          }),
          component: () => {
            containerRenderCount++
            return <div id="container"><Widget/></div>
          }
        })

        app.init({fruit: 'orange'})

        render(<Container/>)

        containerRenderCount = 0
        widgetRenderCount = 0
      })

      it("only tries to update once even though its parent wants to update it as well as itself", () => {
        Widget.prototype.shouldComponentUpdate = () => true
        app.tree.push({path: ['fruit'], value: 'apple', channels: ['fruit']})
        app.commitChanges()
        expect(html('container')).toEqual('<div id="widget">apple</div>')
        expect(containerRenderCount).toEqual(1)
        expect(widgetRenderCount).toEqual(1)
      })
    })

  })

  describe("wiring events to actions", () => {

    let Widget, result

    beforeEach(() => {
      app.registerActions({
        increaseNum: payload => result = payload * 2,
        setTo9: () => result = 9
      })
      Widget = connector(app, {
        events: action => ({
          onClickedIncrease: num => action('increaseNum', num),
          onClickedSet9: 'setTo9'
        }),
        component: ({onClickedIncrease, onClickedSet9}) => {
          return <div>
            <div id="increase" onClick={() => onClickedIncrease(7)}>Hello</div>
            <div id="set9" onClick={onClickedSet9}>Hello</div>
          </div>
        }
      })
      render(<Widget/>)
    })

    it("calls actions wired to", () => {
      const div = document.getElementById('increase')
      div.click()
      expect(result).toEqual(14)
    })

    it("allows passing a string if no args are needed", () => {
      const div = document.getElementById('set9')
      div.click()
      expect(result).toEqual(9)
    })

    it("allows passing a simple object", () => {
      app.registerAction('setTo4', () => result = 4)
      const SimpleWidget = connector(app, {
        events: {
          handleClick: 'setTo4'
        },
        component: ({handleClick}) => {
          return <div id="simple-widget" onClick={handleClick}>Hello</div>
        }
      })
      render(<SimpleWidget/>)
      const div = document.getElementById('simple-widget')
      div.click()
      expect(result).toEqual(4)
    })

  })

  describe("scope", () => {

    let Grandparent, Parent, Child
    let grandparentScope, parentScope, childScope

    beforeEach(() => {
      Child = connector(app, {
        events: (action, scope) => ({
          onClick: () => {
            childScope = scope
          }
        }),
        component: ({onClick}) => <div id="child" onClick={onClick}>Kid</div>
      })
      Parent = connector(app, {
        addToScope: props => ({
          tab: props.tab
        }),
        events: (action, scope) => ({
          onClick: () => parentScope = scope
        }),
        component: ({onClick}) => (<div>
          <div id="parent" onClick={onClick}>Mum</div>
          <Child/>
        </div>)
      })
      Grandparent = connector(app, {
        addToScope: props => ({
          page: props.page
        }),
        events: (action, scope) => ({
          onClick: () => grandparentScope = scope
        }),
        component: ({onClick}) => (<div>
          <div id="grandparent" onClick={onClick}>Granny</div>
          <Parent tab={6} />
        </div>)
      })
      render(<Grandparent page={2} />)
    })

    it("inherits its parent's scope", () => {
      document.getElementById('child').click()
      expect(childScope).toEqual({
        page: 2,
        tab: 6
      })
    })

    it("can add to its parent's scope", () => {
      document.getElementById('parent').click()
      expect(parentScope).toEqual({
        page: 2,
        tab: 6
      })
    })

    it("doesn't interfere with its parent's scope", () => {
      document.getElementById('grandparent').click()
      expect(grandparentScope).toEqual({
        page: 2
      })
    })

    it("defaults the scope to an empty object", () => {
      let scope
      const A = connector(app, {
        events: (action, s) => ({
          onClick: () => scope = s
        }),
        component: ({onClick}) => <div id="a" onClick={onClick}>a</div>
      })
      render(<A/>)
      document.getElementById('a').click()
      expect(scope).toEqual({})
    })

  })

})
