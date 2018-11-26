import React from 'react';
import { render } from 'react-dom';

import { List } from 'immutable';
import SvgSketchCanvas from '../../src';

const modes = {
  0: 'mouse',
  1: 'touch',
  2: 'pen',
  3: 'all',
};

const Demo = class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      penMode: true,
      exportedPaths: null,
      allowOnlyPointerType: 0,
      paths: new List(),
    };

    this.canvas = null;
    this.getNextMode = this.getNextMode.bind(this);
    this.pushPaths = this.pushPaths.bind(this);
    this.updatePaths = this.updatePaths.bind(this);
    this.initializePaths = this.initializePaths.bind(this);
    this.popPath = this.popPath.bind(this);
  }

  getNextMode() {
    this.setState(prevState => ({
      allowOnlyPointerType: (prevState.allowOnlyPointerType + 1) % 4,
    }));
  }

  pushPaths(point) {
    this.setState(state => ({
      paths: state.paths.push(point),
    }));
  }

  updatePaths(point) {
    this.setState(state => ({
      paths: state.paths.updateIn([state.paths.size - 1], pathMap => pathMap.updateIn(['paths'], list => list.push(point))),
    }));
  }

  initializePaths(paths) {
    this.setState({
      paths,
    });
  }

  popPath() {
    this.setState(state => ({
      paths: state.paths.pop(),
    }));
  }

  render() {
    const { exportedPaths, allowOnlyPointerType, paths } = this.state;

    const mode = modes[allowOnlyPointerType];

    return (
      <div>
        <h1>React SVG Sketch Demo</h1>
        <SvgSketchCanvas
          ref={(element) => {
            this.canvas = element;
          }}
          width="600px"
          height="400px"
          strokeWidth={4}
          strokeColor="red"
          allowOnlyPointerType={mode}
          pushPaths={this.pushPaths}
          popPath={this.popPath}
          updatePaths={this.updatePaths}
          initializePaths={this.initializePaths}
          paths={paths}
        />
        <button
          type="button"
          onClick={() => {
            this.canvas.undo();
          }}
        >
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            this.canvas.redo();
          }}
        >
          Redo
        </button>
        <button
          type="button"
          onClick={() => {
            this.canvas.eraseMode(false);
          }}
        >
          Pen
        </button>
        <button
          type="button"
          onClick={() => {
            this.canvas.eraseMode(true);
          }}
        >
          Erase
        </button>
        <button
          type="button"
          onClick={() => {
            this.canvas.clearCanvas();
          }}
        >
          Reset canvas
        </button>
        <button
          type="button"
          onClick={() => {
            this.canvas
              .exportImage('png')
              .then((data) => {
                console.log(data);
              })
              .catch((e) => {
                console.log(e);
              });
          }}
        >
          Get Image
        </button>
        <button
          type="button"
          onClick={() => {
            this.canvas
              .exportPaths()
              .then((data) => {
                this.setState({
                  exportedPaths: data,
                });
              })
              .catch((e) => {
                console.log(e);
              });
          }}
        >
          Get Paths
        </button>
        <button
          type="button"
          disabled={exportedPaths === null}
          onClick={() => {
            this.canvas.loadPaths(exportedPaths);
          }}
        >
          Load Paths
        </button>
        <span>{`Current allowed mode: ${mode}`}</span>
        <button type="button" onClick={this.getNextMode}>
          Switch mode
        </button>
      </div>
    );
  }
};

render(<Demo />, document.querySelector('#demo'));
