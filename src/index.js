import React from 'react';
import { List, Map } from 'immutable';
import PropTypes from 'prop-types';
import Paths from './Paths';

const SvgSketchCanvas = class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      drawMode: true,
      isDrawing: false,
      reset: false,
      resetStore: new List(),
      redoStore: new List(),
    };

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.getCoordinates = this.getCoordinates.bind(this);

    this.exportImage = this.exportImage.bind(this);
    this.exportSvg = this.exportSvg.bind(this);
    // this.exportPaths = this.exportPaths.bind(this);
    // this.loadPaths = this.loadPaths.bind(this);

    this.eraseMode = this.eraseMode.bind(this);
    this.clearCanvas = this.clearCanvas.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);

    this.svgCanvas = null;
  }

  /* Add event listener to Mouse up and Touch up to
  release drawing even when point goes out of canvas */
  componentDidMount() {
    document.addEventListener('pointerup', this.handlePointerUp);
  }

  componentWillUnmount() {
    document.removeEventListener('pointerup', this.handlePointerUp);
  }

  // Converts mouse coordinates to relative coordinate based on the absolute position of svg
  getCoordinates(pointerEvent) {
    const boundingArea = this.svgCanvas.getBoundingClientRect();
    return new Map({
      x: pointerEvent.pageX - boundingArea.left,
      y: pointerEvent.pageY - boundingArea.top,
    });
  }

  /* Mouse Handlers - Mouse down, move and up */

  handlePointerDown(pointerEvent) {
    // Allow only chosen pointer type
    const { allowOnlyPointerType } = this.props;
    if (allowOnlyPointerType !== 'all' && pointerEvent.pointerType !== allowOnlyPointerType) return;

    if (pointerEvent.pointerType === 'mouse' && pointerEvent.button !== 0) return;

    const { drawMode } = this.state;
    const point = this.getCoordinates(pointerEvent);

    const { pushPaths } = this.props;

    // PUSH
    pushPaths(
      new Map({
        drawMode,
        paths: new List([point]),
      }),
    );

    this.setState({
      isDrawing: true,
      reset: false,
      redoStore: new List(),
    });
  }

  handlePointerMove(pointerEvent) {
    const { isDrawing } = this.state;

    if (!isDrawing) return;

    // Allow only chosen pointer type
    const { allowOnlyPointerType } = this.props;
    if (allowOnlyPointerType !== 'all' && pointerEvent.pointerType !== allowOnlyPointerType) return;

    const point = this.getCoordinates(pointerEvent);

    const { updatePaths } = this.props;

    updatePaths(point);

    // this.setState(state => ({
    //   currentPaths: state.currentPaths.updateIn([state.currentPaths.size - 1],
    // pathMap => pathMap.updateIn(['paths'], list => list.push(point))),
    // }));
  }

  handlePointerUp(pointerEvent) {
    if (pointerEvent.pointerType === 'mouse' && pointerEvent.button !== 0) return;

    // Allow only chosen pointer type
    const { allowOnlyPointerType } = this.props;
    if (allowOnlyPointerType !== 'all' && pointerEvent.pointerType !== allowOnlyPointerType) return;

    this.setState({
      isDrawing: false,
    });
  }

  /* Mouse Handlers ends */

  /* Canvas operations */

  eraseMode(erase) {
    this.setState({
      drawMode: !erase,
    });
  }

  clearCanvas() {
    const { paths, initializePaths } = this.props;

    this.setState({
      reset: true,
      // resetStore: state.currentPaths,
      resetStore: paths,
    });

    initializePaths(new List());
  }

  undo() {
    const { reset, resetStore } = this.state;
    const { paths, initializePaths, popPath } = this.props;

    if (reset) {
      initializePaths(resetStore);

      this.setState({
        resetStore: new List(),
        // currentPaths: state.resetStore,
      });
      return;
    }

    if (paths.isEmpty()) return;

    this.setState(state => ({
      reset: false,
      redoStore: state.redoStore.push(paths.get(-1)),
      // currentPaths: state.currentPaths.pop(),
    }));

    popPath();
  }

  redo() {
    const { redoStore } = this.state;
    const { pushPaths } = this.props;

    if (redoStore.isEmpty()) return;

    this.setState(state => ({
      redoStore: state.redoStore.pop(),
      // currentPaths: state.currentPaths.push(state.redoStore.get(-1)),
    }));

    pushPaths(redoStore.get(-1));
  }

  /* Exporting options */

  // Creates a image from SVG and renders it on canvas, then exports the canvas as image
  exportImage(imageType) {
    return new Promise((resolve, reject) => {
      try {
        const img = document.createElement('img');
        img.src = `data:image/svg+xml;base64,${btoa(this.svgCanvas.innerHTML)}`;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.setAttribute('width', this.svgCanvas.offsetWidth);
          canvas.setAttribute('height', this.svgCanvas.offsetHeight);
          canvas.getContext('2d').drawImage(img, 0, 0);

          resolve(canvas.toDataURL(`image/${imageType}`));
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  exportSvg() {
    return new Promise((resolve, reject) => {
      try {
        resolve(this.svgCanvas.innerHTML);
      } catch (e) {
        reject(e);
      }
    });
  }

  /* Finally!!! Render method */

  render() {
    const {
      width,
      height,
      canvasColor,
      background,
      strokeColor,
      strokeWidth,
      eraserWidth,
      style,
      paths,
    } = this.props;

    return (
      <div
        role="presentation"
        ref={(element) => {
          this.svgCanvas = element;
        }}
        style={{
          touchAction: 'none',
          width,
          height,
          ...style,
        }}
        onPointerDown={this.handlePointerDown}
        onPointerMove={this.handlePointerMove}
        onPointerUp={this.handlePointerUp}
      >
        <svg
          version="1.1"
          baseProfile="full"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
            background: `${background} ${canvasColor}`,
          }}
        >
          <g id="svgCanvasPenStrokes">
            <Paths
              strokeWidth={strokeWidth}
              eraserWidth={eraserWidth}
              paths={paths}
              strokeColor={strokeColor}
              canvasColor={canvasColor}
            />
          </g>
        </svg>
      </div>
    );
  }
};

/* Default settings */

SvgSketchCanvas.defaultProps = {
  width: '100%',
  height: '100%',
  canvasColor: 'white',
  strokeColor: 'black',
  background: '',
  strokeWidth: 4,
  eraserWidth: 8,
  allowOnlyPointerType: 'pen',
  style: {
    border: '0.0625rem solid #9c9c9c',
    borderRadius: '0.25rem',
  },
};

/* Props validation */

SvgSketchCanvas.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  strokeColor: PropTypes.string,
  canvasColor: PropTypes.string,
  background: PropTypes.string,
  strokeWidth: PropTypes.number,
  eraserWidth: PropTypes.number,
  allowOnlyPointerType: PropTypes.string,
  style: PropTypes.objectOf(PropTypes.string),
  pushPaths: PropTypes.func.isRequired,
  updatePaths: PropTypes.func.isRequired,
  initializePaths: PropTypes.func.isRequired,
  popPath: PropTypes.func.isRequired,
  paths: PropTypes.objectOf(List).isRequired,
};

export default SvgSketchCanvas;
