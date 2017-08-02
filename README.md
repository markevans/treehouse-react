# Treehouse-React

[![Build Status](https://travis-ci.org/markevans/treehouse-react.svg?branch=master)](https://travis-ci.org/markevans/treehouse-react)

Treehouse-React is a very small library for making it easy to use [Treehouse JS](https://github.com/markevans/treehouse) with React.

## Overview
Treehouse-React provides the `wrap` function, which wraps a React component, connecting it to the Treehouse state tree.
You should understand the README at [Treehouse JS](https://github.com/markevans/treehouse), particularly regarding TreeView objects, before reading this.

`wrap` has the signature

    wrap(<React.Component>, <Treehouse.TreeView>)

Very simply, it makes items specified in the treeView available in the component's props object.

An example is

```JSX
import React from 'react'
import treehouse from 'treehouse'
import { wrap } from 'treehouse-react'

const CarList = wrap(
  ({cars}) => (   // React Component
    <ul>
      {cars.map(car => <Car car={car} key={car.id} />)}
    </ul>
  ),
  treehouse.treeView((t) => {
    return {
      cars: t.query('latestCars')
    }
  })
)
```

## To-do app
Below is a working to-do app using React, written in JSX, that should give an idea of how it works.

Note that it also uses the [Treehouse-React](https://github.com/markevans/treehouse-react) package, which provides the `wrap` method, which connects components to the treehouse state tree.

```JSX
import React from 'react'
import treehouse from 'treehouse'
import { wrap } from 'treehouse-react'
import { remove, setAttribute } from 'treehouse/reducers'

// Initialize state tree
treehouse.init({
  items: {
    id1: {title: 'Run home', id: 'id1', created: Date.now()},
    id2: {title: 'Wash up', id: 'id2', created: Date.now()},
    id3: {title: 'Solve Quantum Gravity', id: 'id3', created: Date.now()}
  }
})

const App = () => (
  <div className="app">
    <AddForm/>
    <List/>
  </div>
)

class AddForm extends React.Component {
  constructor (props) {
    super(props)
    this.state = {newTitle: ''}
  }

  onChange (e) {
    this.setState({newTitle: e.target.value})
  }


  onSubmit (e) {
    e.preventDefault()
    treehouse.action('addTodo')({title: this.state.newTitle})
    this.setState({newTitle: ''}) // to reset the text field
  }

  render () {
    return (
      <form onSubmit={this.onSubmit.bind(this)}>
        <input autoComplete="off" onChange={this.onChange.bind(this)} name="title" value={this.state.newTitle} />
        <button>Add</button>
      </form>
    )
  }
}

const List = wrap(

  ({items}) => (
    <ul className="list">
      {items.map((item) => {
        return <Item item={item} key={item.id}/>
      })}
    </ul>
  ),

  treehouse.treeView(t => {
    return {
      items: t.query('itemsByRecent')
    }
  })

)

const Item = ({item}) => (
  <li>
    {item.title}
    <a onClick={treehouse.action('removeTodo', {id: item.id})}> X</a>
  </li>
)

// Actions
treehouse.registerActions({

  addTodo (tree, {title}) {
    // Using Math.random is not ideal but this illustrates the concept
    let newTodo = {id: Math.random(), title: title, created: Date.now()}
    tree.at('items').$(setAttribute, newTodo.id, newTodo)
  },

  removeTodo (tree, {id}) {
    tree.at('items').$(remove, id)
  }

})

// Queries
treehouse.registerQueries({

  itemsByRecent: {
    deps: (t) => {
      return {
        items: t.at('items')
      }
    },
    get: ({items}) => {
      return Object.values(items).sort((a, b) => {
        return a.created < b.created
      })
    }
  }

})

export default App  // And render it into the DOM somewhere
```
