const JSDOM = require("jsdom").JSDOM;
const App = require('treehouse/lib/App')
const React = require('react')
const ReactDOM = require('react-dom')
const wrap = require('../lib').wrap

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
      Widget = wrap(
        ({theFruit}) => {
          widgetRenderCount++
          return <div id="widget">{theFruit}</div>
        },

        app.treeView(t => {
          return {
            theFruit: t.at(['fruit'])
          }
        })
      )
    })

    it("renders from the tree", () => {
      app.trunk().set({fruit: 'orange', animal: 'sheep'})
      app.commit()
      render(<Widget />)
      expect(html('widget')).toEqual('orange')
    })

    describe("using props", () => {

      beforeEach(() => {
        Widget = wrap(
          ({a, b, c}) => (<div id="alphabet">{[a,b,c].join(',')}</div>),

          app.treeView(t => {
            return {
              a: t.at('a'),
              b: t.at('b')
            }
          })
        )
      })

      it("merges props, giving priority to passed in ones", () => {
        app.trunk().set({a: 'AYE', b: 'BEE'})
        render(<Widget b="beta" c="gamma" />)
        expect(html('alphabet')).toEqual('AYE,beta,gamma')
      })
    })

    describe("updating", () => {

      beforeEach(() => {
        app.trunk().set({fruit: 'orange', animal: 'sheep'})
        app.commit()
        render(<Widget/>)
        widgetRenderCount = 0
      })

      it("updates when the relevant branch has been touched", () => {
        app.at(['fruit']).set('apple')
        app.commit()
        expect(html('widget')).toEqual('apple')
        expect(widgetRenderCount).toEqual(1)
      })

      it("doesn't update when the relevant branch hasn't been touched", () => {
        app.at(['animal']).set('sloth')
        app.commit()
        expect(html('widget')).toEqual('orange')
        expect(widgetRenderCount).toEqual(0)
      })

      it("doesn't call render if the state from tree is the same", () => {
        spyOn(app, 'log') // Suppress log warning
        app.at(['fruit']).set('orange')
        app.commit()
        expect(html('widget')).toEqual('orange')
        expect(widgetRenderCount).toEqual(0)
      })

    })

    describe("parent-child relationships", () => {

      let Container, containerRenderCount

      beforeEach(() => {
        Container = wrap(
          () => {
            containerRenderCount++
            return <div id="container"><Widget/></div>
          },

          app.treeView(t => {
            return {
              fruit: t.at(['fruit'])
            }
          })
        )

        app.trunk().set({fruit: 'orange'})
        app.commit()

        render(<Container/>)

        containerRenderCount = 0
        widgetRenderCount = 0
      })

      it("only updates once even though its parent wants to update it as well as itself", () => {
        app.at(['fruit']).set('apple')
        app.commit()
        expect(html('container')).toEqual('<div id="widget">apple</div>')
        expect(containerRenderCount).toEqual(1)
        expect(widgetRenderCount).toEqual(1)
      })
    })

  })

})
