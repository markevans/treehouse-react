const React = require('react')
const shallowCompare = require('./shallow_compare')

const wrap = (Component, treeView) => {

  class WrappedComponent extends React.Component {

    componentWillMount () {
      if (treeView) {
        treeView.watch(this.syncWithTree.bind(this))
        this.syncWithTree()
      }
    }

    componentWillReceiveProps () {
      this.syncWithTree()
    }

    syncWithTree () {
      if (treeView) {
        this.setState(treeView.get())
      }
    }

    shouldComponentUpdate (nextProps, nextState) {
      return !shallowCompare(this.state, nextState) || !shallowCompare(this.props, nextProps)
    }

    componentDidUpdate () {
      if (treeView) {
        treeView.markClean()
      }
    }

    componentWillUnmount () {
      if (treeView) {
        treeView.unwatch()
      }
    }

    render () {
      return React.createElement(Component, Object.assign({}, this.state, this.props))
    }
  }

  return WrappedComponent
}

module.exports = {
  wrap: wrap
}
