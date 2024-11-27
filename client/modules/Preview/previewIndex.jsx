import React, { useReducer, useState, useEffect, useMemo } from 'react';
import { render } from 'react-dom';
import { createGlobalStyle, ThemeProvider } from 'styled-components';
import {
  registerFrame,
  listen,
  MessageTypes,
  dispatchMessage
} from '../../utils/dispatcher';
import { filesReducer, setFiles } from './filesReducer';
import EmbedFrame from './EmbedFrame';
import CoordinateTracker from './CoordinateTracker';
import theme from '../../theme';
import { CoordinatesProvider, useCoordinates } from './contexts';
import getConfig from '../../utils/getConfig';
import { initialState } from '../IDE/reducers/files';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
  }
`;

const App = () => {
  const [state, dispatch] = useReducer(filesReducer, [], initialState);
  const [isPlaying, setIsPlaying] = useState(false);
  const [basePath, setBasePath] = useState('');
  const [textOutput, setTextOutput] = useState(false);
  const [gridOutput, setGridOutput] = useState(false);
  const [coordinatesVisible] = useState(true);

  const { updateCoordinates } = useCoordinates();

  registerFrame(window.parent, getConfig('EDITOR_URL'));

  function handleMessageEvent(message) {
    const { type, payload } = message;
    switch (type) {
      case MessageTypes.SKETCH:
        dispatch(setFiles(payload.files));
        setBasePath(payload.basePath);
        setTextOutput(payload.textOutput);
        setGridOutput(payload.gridOutput);
        break;
      case MessageTypes.START:
        setIsPlaying(true);
        break;
      case MessageTypes.STOP:
        setIsPlaying(false);
        break;
      case MessageTypes.REGISTER:
        dispatchMessage({ type: MessageTypes.REGISTER });
        break;
      case MessageTypes.EXECUTE:
        dispatchMessage(payload);
        break;
      case MessageTypes.COORDINATES:
        updateCoordinates(payload);
        break;
      default:
        break;
    }
  }

  function addCacheBustingToAssets(files) {
    const timestamp = new Date().getTime();
    return files.map((file) => {
      if (file.url && !file.url.endsWith('obj') && !file.url.endsWith('stl')) {
        return {
          ...file,
          url: `${file.url}?v=${timestamp}`
        };
      }
      return file;
    });
  }

  const memoizedFiles = useMemo(() => addCacheBustingToAssets(state), [
    state,
    addCacheBustingToAssets
  ]);

  useEffect(() => {
    const unsubscribe = listen(handleMessageEvent);
    return function cleanup() {
      unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {coordinatesVisible && <CoordinateTracker coordinates />}
      <EmbedFrame
        files={memoizedFiles}
        isPlaying={isPlaying}
        basePath={basePath}
        gridOutput={gridOutput}
        textOutput={textOutput}
      />
    </ThemeProvider>
  );
};

const Root = () => (
  <CoordinatesProvider>
    <App />
  </CoordinatesProvider>
);

render(<Root />, document.getElementById('root'));
