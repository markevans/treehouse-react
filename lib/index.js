const React = require('react')

function mapEventsToActions (eventSpecs, actionFunc, scope) {
  if (typeof(eventSpecs) === 'function') {
    eventSpecs = eventSpecs(actionFunc, scope)
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

const connector = (app, {pick, events, addToScope, component}) => {

  class WrappedComponent extends React.PureComponent {

    constructor (...args) {
      super(...args)
      this.treeView = pick ? app.pick(pick) : null
      this.eventHandlers = events ? mapEventsToActions(events, app.action.bind(app), this.scope()) : null
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

    scope () {
      if (!this._scope) {
        this._scope = Object.assign(
          {},
          this.context && this.context.treehouseScope,
          addToScope && addToScope(this.props)
        )
      }
      return this._scope
    }

    render () {
      return React.createElement(component, Object.assign({}, this.state, this.props, this.eventHandlers))
    }
  }

  if (addToScope) {
    WrappedComponent.prototype.getChildContext = function () {
      return {
        treehouseScope: this.scope()
      }
    }
    WrappedComponent.childContextTypes = {
      treehouseScope: () => null
    }
  }

  WrappedComponent.contextTypes = {
    treehouseScope: () => {}
  }

  return WrappedComponent
}


module.exports = {
  connector
}
