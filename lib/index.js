const React = require('react')

function mapEventsToActions (eventSpecs, actionFunc) {
  if (typeof(eventSpecs) === 'function') {
    eventSpecs = eventSpecs(actionFunc)
  }
  let key
  const eventHandlers = {}
  for(key in eventSpecs) {
    let eventHandler = eventSpecs[key]
    if (typeof(eventHandler) === 'string') {
      let name = eventHandler
      eventHandler = () => actionFunc(name)
    }
    eventHandlers[key] = eventHandler
  }
  return eventHandlers
}

const connector = (app, {pick, events, component}) =>

  class WrappedComponent extends React.PureComponent {

    constructor (props) {
      super(props)
      this.treeView = pick ? app.pick(pick) : null
      this.eventHandlers = events ? mapEventsToActions(events, app.action.bind(app)) : null
    }

    componentWillMount () {
      if (this.treeView) {
        this.treeView.watch(this.syncWithTree.bind(this))
        this.syncWithTree()
      }
    }

    componentWillReceiveProps () {
      this.syncWithTree()
    }

    syncWithTree () {
      if (this.treeView) {
        this.setState(this.treeView.get())
      }
    }

    componentDidUpdate () {
      if (this.treeView) {
        this.treeView.markClean()
      }
    }

    componentWillUnmount () {
      if (this.treeView) {
        this.treeView.unwatch()
      }
    }

    render () {
      return React.createElement(component, Object.assign({}, this.state, this.props, this.eventHandlers))
    }
  }

module.exports = {
  connector
}
