const React = require('react')

const connect = (app, {pick, events}) =>

  Component =>

    class WrappedComponent extends React.PureComponent {

      constructor (props) {
        super(props)
        this.treeView = pick ? app.pick(pick) : null
        this.eventHandlers = events ? events(app.event.bind(app)) : null
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
        return React.createElement(Component, Object.assign({}, this.state, this.props, this.eventHandlers))
      }
    }

module.exports = {
  connect
}
