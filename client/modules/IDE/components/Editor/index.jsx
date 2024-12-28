import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';
import Fuse from 'fuse.js';
import emmet from '@emmetio/codemirror-plugin';
import prettier from 'prettier/standalone';
import babelParser from 'prettier/parser-babel';
import htmlParser from 'prettier/parser-html';
import cssParser from 'prettier/parser-postcss';
import { withTranslation } from 'react-i18next';
import StackTrace from 'stacktrace-js';
import 'codemirror/mode/css/css';
import 'codemirror/mode/clike/clike';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/javascript-lint';
import 'codemirror/addon/lint/css-lint';
import 'codemirror/addon/lint/html-lint';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/indent-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/comment/comment';
import 'codemirror/keymap/sublime';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/matchesonscrollbar';
import 'codemirror/addon/search/match-highlighter';
import 'codemirror/addon/search/jump-to-line';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/selection/mark-selection';
import 'codemirror/addon/hint/css-hint';
import 'codemirror-colorpicker';

import { JSHINT } from 'jshint';
import { CSSLint } from 'csslint';
import { HTMLHint } from 'htmlhint';
import classNames from 'classnames';
import { debounce } from 'lodash';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import MediaQuery from 'react-responsive';
import '../../../../utils/htmlmixed';
import '../../../../utils/p5-javascript';
import { metaKey } from '../../../../utils/metaKey';
import '../show-hint';
import * as hinter from '../../../../utils/p5-hinter';
import '../../../../utils/codemirror-search';

import beepUrl from '../../../../sounds/audioAlert.mp3';
import RightArrowIcon from '../../../../images/right-arrow.svg';
import LeftArrowIcon from '../../../../images/left-arrow.svg';
import { getHTMLFile } from '../../reducers/files';
import { selectActiveFile } from '../../selectors/files';

import * as FileActions from '../../actions/files';
import * as IDEActions from '../../actions/ide';
import * as ProjectActions from '../../actions/project';
import * as EditorAccessibilityActions from '../../actions/editorAccessibility';
import * as PreferencesActions from '../../actions/preferences';
import * as UserActions from '../../../User/actions';
import * as ConsoleActions from '../../actions/console';

import AssetPreview from '../AssetPreview';
import Timer from '../Timer';
import EditorAccessibility from '../EditorAccessibility';
import UnsavedChangesIndicator from '../UnsavedChangesIndicator';
import { EditorContainer, EditorHolder } from './MobileEditor';
import { FolderIcon } from '../../../../common/icons';
import IconButton from '../../../../common/IconButton';

emmet(CodeMirror);

window.JSHINT = JSHINT;
window.CSSLint = CSSLint;
window.HTMLHint = HTMLHint;

const INDENTATION_AMOUNT = 2;

function Editor(props) {
  const [currentLine, setCurrentLine] = useState(1);
  const cmRef = useRef(null);
  const beepRef = useRef(new Audio(beepUrl));
  const codemirrorContainerRef = useRef(null);
  const hinterRef = useRef(null);
  const docsRef = useRef({});
  const prevFileId = useRef(props.file.id);

  const prettierFormatWithCursor = (parser, plugins) => {
    try {
      const { formatted, cursorOffset } = prettier.formatWithCursor(
        cmRef.current.doc.getValue(),
        {
          cursorOffset: cmRef.current.doc.indexFromPos(
            cmRef.current.doc.getCursor()
          ),
          parser,
          plugins
        }
      );
      const { left, top } = cmRef.current.getScrollInfo();
      cmRef.current.doc.setValue(formatted);
      cmRef.current.focus();
      cmRef.current.doc.setCursor(cmRef.current.doc.posFromIndex(cursorOffset));
      cmRef.current.scrollTo(left, top);
    } catch (error) {
      console.error(error);
    }
  };

  const tidyCode = () => {
    if (!cmRef.current) return;
    const mode = cmRef.current.getOption('mode');
    if (mode === 'javascript') {
      prettierFormatWithCursor('babel', [babelParser]);
    } else if (mode === 'css') {
      prettierFormatWithCursor('css', [cssParser]);
    } else if (mode === 'htmlmixed') {
      prettierFormatWithCursor('html', [htmlParser]);
    }
  };

  const updateLintingMessageAccessibility = debounce((annotations) => {
    props.clearLintMessage();
    annotations.forEach((x) => {
      if (x.from.line > -1) {
        props.updateLintMessage(x.severity, x.from.line + 1, x.message);
      }
    });
    if (props.lintMessages.length > 0 && props.lintWarning) {
      beepRef.current.play();
    }
  }, 2000);

  const initializeDocuments = (files) => {
    const docs = {};
    files.forEach((file) => {
      if (file.name !== 'root') {
        if (!docsRef.current[file.id]) {
          docs[file.id] = CodeMirror.Doc(file.content, getFileMode(file.name)); // eslint-disable-line
        } else {
          docs[file.id] = docsRef.current[file.id];
        }
      }
    });
    docsRef.current = docs;
  };

  const getFileMode = (fileName) => {
    let mode;
    if (fileName.match(/.+\.js$/i)) {
      mode = 'javascript';
    } else if (fileName.match(/.+\.css$/i)) {
      mode = 'css';
    } else if (fileName.match(/.+\.(html|xml)$/i)) {
      mode = 'htmlmixed';
    } else if (fileName.match(/.+\.json$/i)) {
      mode = 'application/json';
    } else if (fileName.match(/.+\.(frag|glsl)$/i)) {
      mode = 'x-shader/x-fragment';
    } else if (fileName.match(/.+\.(vert|stl|mtl)$/i)) {
      mode = 'x-shader/x-vertex';
    } else {
      mode = 'text/plain';
    }
    return mode;
  };

  const showHint = (_cm) => {
    if (!props.autocompleteHinter) {
      CodeMirror.showHint(_cm, () => {}, {});
      return;
    }
    let focusedLinkElement = null;
    const setFocusedLinkElement = (set) => {
      if (set && !focusedLinkElement) {
        const activeItemLink = document.querySelector(
          `.CodeMirror-hint-active a`
        );
        if (activeItemLink) {
          focusedLinkElement = activeItemLink;
          focusedLinkElement.classList.add('focused-hint-link');
          focusedLinkElement.parentElement.parentElement.classList.add(
            'unfocused'
          );
        }
      }
    };
    const removeFocusedLinkElement = () => {
      if (focusedLinkElement) {
        focusedLinkElement.classList.remove('focused-hint-link');
        focusedLinkElement.parentElement.parentElement.classList.remove(
          'unfocused'
        );
        focusedLinkElement = null;
        return true;
      }
      return false;
    };

    const hintOptions = {
      _fontSize: props.fontSize,
      completeSingle: false,
      extraKeys: {
        'Shift-Right': (cm, e) => {
          const activeItemLink = document.querySelector(
            `.CodeMirror-hint-active a`
          );
          if (activeItemLink) activeItemLink.click();
        },
        Right: (cm, e) => {
          setFocusedLinkElement(true);
        },
        Left: (cm, e) => {
          removeFocusedLinkElement();
        },
        Up: (cm, e) => {
          const onLink = removeFocusedLinkElement();
          e.moveFocus(-1);
          setFocusedLinkElement(onLink);
        },
        Down: (cm, e) => {
          const onLink = removeFocusedLinkElement();
          e.moveFocus(1);
          setFocusedLinkElement(onLink);
        },
        Enter: (cm, e) => {
          if (focusedLinkElement) focusedLinkElement.click();
          else e.pick();
        }
      },
      closeOnUnfocus: false
    };

    if (_cm.options.mode === 'javascript') {
      // JavaScript
      CodeMirror.showHint(
        _cm,
        () => {
          const c = _cm.getCursor();
          const token = _cm.getTokenAt(c);

          const hints = hinterRef.current
            .search(token.string)
            .filter((h) => h.item.text[0] === token.string[0]);

          return {
            list: hints,
            from: CodeMirror.Pos(c.line, token.start),
            to: CodeMirror.Pos(c.line, c.ch)
          };
        },
        hintOptions
      );
    } else if (_cm.options.mode === 'css') {
      // CSS
      CodeMirror.showHint(_cm, CodeMirror.hint.css, hintOptions);
    }
  };

  const handleChange = debounce(() => {
    props.setUnsavedChanges(true);
    props.hideRuntimeErrorWarning();
    props.updateFileContent(props.file.id, cmRef.current.getValue());
    if (props.autorefresh && props.isPlaying) {
      props.clearConsole();
      props.startSketch();
    }
  }, 1000);

  const handleKeyUp = () => {
    const lineNumber = parseInt(cmRef.current.getCursor().line + 1, 10);
    setCurrentLine(lineNumber);
  };

  const handleKeydown = (cm, event) => {
    const mode = cm.getOption('mode');
    if (
      /^[a-z]$/i.test(event.key) &&
      (mode === 'css' || mode === 'javascript')
    ) {
      showHint(cm);
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      const selections = cm.listSelections();
      if (selections.length > 1) {
        const firstPos = selections[0].head || selections[0].anchor;
        cm.setSelection(firstPos);
        cm.scrollIntoView(firstPos);
      } else {
        cm.getInputField().blur();
      }
    }
  };

  const showFind = () => {
    if (!cmRef.current) return;
    cmRef.current.execCommand('findPersistent');
  };
  // eslint-disable-next-line consistent-return
  const getContent = () => {
    if (cmRef.current) {
      const content = cmRef.current.getValue();
      const updatedFile = Object.assign({}, props.file, { content });
      return updatedFile;
    }
  };
  const showReplace = () => {
    if (!cmRef.current) return;
    cmRef.current.execCommand('replace');
  };

  useEffect(() => {
    console.log('Editor useEffect');
    cmRef.current = CodeMirror(codemirrorContainerRef.current, {
      theme: `p5-${props.theme}`,
      lineNumbers: props.lineNumbers,
      styleActiveLine: true,
      inputStyle: 'contenteditable',
      lineWrapping: props.linewrap,
      fixedGutter: false,
      foldGutter: true,
      foldOptions: { widget: '\u2026' },
      gutters: ['CodeMirror-foldgutter', 'CodeMirror-lint-markers'],
      keyMap: 'sublime',
      highlightSelectionMatches: true, // highlight current search match
      matchBrackets: true,
      emmet: {
        preview: ['html'],
        markTagPairs: true,
        autoRenameTags: true
      },
      autoCloseBrackets: props.autocloseBracketsQuotes,
      styleSelectedText: true,
      lint: {
        onUpdateLinting: (annotations) => {
          updateLintingMessageAccessibility(annotations);
        },
        options: {
          asi: true,
          eqeqeq: false,
          '-W041': false,
          esversion: 11
        }
      },
      colorpicker: {
        type: 'sketch',
        mode: 'edit'
      }
    });

    hinterRef.current = new Fuse(hinter.p5Hinter, {
      threshold: 0.05,
      keys: ['text']
    });

    if (cmRef.current.options.lint && cmRef.current.options.lint.options) {
      delete cmRef.current.options.lint.options.errors;
    }
    const replaceCommand =
      metaKey === 'Ctrl' ? `${metaKey}-H` : `${metaKey}-Option-F`;

    cmRef.current.setOption('extraKeys', {
      Tab: (cm) => {
        if (!cm.execCommand('emmetExpandAbbreviation')) return;
        // might need to specify and indent more?
        const selection = cm.doc.getSelection();
        if (selection.length > 0) {
          cm.execCommand('indentMore');
        } else {
          cm.replaceSelection(' '.repeat(INDENTATION_AMOUNT));
        }
      },
      Enter: 'emmetInsertLineBreak',
      Esc: 'emmetResetAbbreviation',
      [`${metaKey}-Enter`]: () => null,
      [`Shift-${metaKey}-Enter`]: () => null,
      [`${metaKey}-F`]: 'findPersistent',
      [`Shift-${metaKey}-F`]: tidyCode,
      [`${metaKey}-G`]: 'findPersistentNext',
      [`Shift-${metaKey}-G`]: 'findPersistentPrev',
      [replaceCommand]: 'replace',
      // Cassie Tarakajian: If you don't set a default color, then when you
      // choose a color, it deletes characters inline. This is a
      // hack to prevent that.
      [`${metaKey}-K`]: (cm, event) =>
        cm.state.colorpicker.popup_color_picker({ length: 0 }),
      [`${metaKey}-.`]: 'toggleComment' // Note: most adblockers use the shortcut ctrl+.
    });
    initializeDocuments(props.files);
    if (docsRef.current[props.file.id]) {
      cmRef.current.swapDoc(docsRef.current[props.file.id]);
    }

    if (cmRef.current) {
      cmRef.current.on('keyup', handleKeyUp);
    }

    // prettier-ignore
    cmRef.current.getWrapperElement().style['font-size'] =
      `${props.fontSize}px`;

    props.provideController({
      tidyCode,
      showFind,
      showReplace,
      getContent
    });

    return () => {
      if (cmRef.current) {
        cmRef.current.off('keyup', handleKeyUp);
      }
      props.provideController(null);
    };
  }, []);

  useEffect(() => {
    if (cmRef.current) {
      cmRef.current.on('change', handleChange);
    }
    return () => {
      cmRef.current.off('change', handleChange);
    };
  }, [props.autorefresh, props.isPlaying, props.file.id]);

  useEffect(() => {
    if (cmRef.current) {
      cmRef.current.on('keydown', handleKeydown);
    }
    return () => {
      cmRef.current.off('keydown', handleKeydown);
    };
  }, [props.autocompleteHinter]);

  useEffect(() => {
    initializeDocuments(props.files);
  }, [props.files]);

  useEffect(() => {
    if (!cmRef.current) return;

    const fileMode = getFileMode(props.file.name);
    if (fileMode === 'javascript') {
      cmRef.current.setOption('emmet', {
        preview: ['html'],
        markTagPairs: false,
        autoRenameTags: true
      });
    }

    if (props.file.id !== prevFileId.current) {
      const oldDoc = cmRef.current.swapDoc(docsRef.current[props.file.id]);
      docsRef.current[prevFileId.current] = oldDoc;
      cmRef.current.focus();

      if (!props.unsavedChanges) {
        setTimeout(() => props.setUnsavedChanges(false), 400);
      }

      prevFileId.current = props.file.id;
      cmRef.current.focus();
    }
  }, [props.file.id, props.file.name, props.unsavedChanges]);

  // useEffect(() => {
  //   if (!cmRef.current) return;
  //   if (!props.unsavedChanges) {
  //     const timeout = setTimeout(() => {
  //       props.setUnsavedChanges(false);
  //     }, 400);
  //     // eslint-disable-next-line consistent-return
  //     return () => clearTimeout(timeout);
  //   }
  // }, [props.unsavedChanges]);

  useEffect(() => {
    if (!cmRef.current) return;
    // prettier-ignore
    cmRef.current.getWrapperElement().style['font-size'] =
      `${props.fontSize}px`;
  }, [props.fontSize]);

  useEffect(() => {
    if (!cmRef.current) return;
    cmRef.current.setOption('lineWrapping', props.linewrap);
  }, [props.linewrap]);

  useEffect(() => {
    if (!cmRef.current) return;
    cmRef.current.setOption('theme', `p5-${props.theme}`);
  }, [props.theme]);

  useEffect(() => {
    if (!cmRef.current) return;
    cmRef.current.setOption('lineNumbers', props.lineNumbers);
  }, [props.lineNumbers]);

  useEffect(() => {
    if (!cmRef.current) return;
    cmRef.current.setOption('autoCloseBrackets', props.autocloseBracketsQuotes);
  }, [props.autocloseBracketsQuotes]);

  useEffect(() => {
    if (!cmRef.current) return;

    if (props.runtimeErrorWarningVisible) {
      props.consoleEvents.forEach((consoleEvent) => {
        if (consoleEvent.method === 'error') {
          const errorObj = { stack: consoleEvent.data[0].toString() };
          StackTrace.fromError(errorObj).then((stackLines) => {
            props.expandConsole();
            const line = stackLines.find(
              (l) => l.fileName && l.fileName.startsWith('/')
            );
            if (!line) return;
            const fileNameArray = line.fileName.split('/');
            const fileName = fileNameArray.slice(-1)[0];
            const filePath = fileNameArray.slice(0, -1).join('/');
            const fileWithError = props.files.find(
              (f) => f.name === fileName && f.filePath === filePath
            );
            props.setSelectedFile(fileWithError.id);
            cmRef.current.addLineClass(
              line.lineNumber - 1,
              'background',
              'line-runtime-error'
            );
          });
        }
      });
    } else {
      for (let i = 0; i < cmRef.current.lineCount(); i += 1) {
        cmRef.current.removeLineClass(i, 'background', 'line-runtime-error');
      }
    }
  }, [props.runtimeErrorWarningVisible, props.consoleEvents]);

  useEffect(() => {
    if (!cmRef.current) return;
    for (let i = 0; i < cmRef.current.lineCount(); i += 1) {
      cmRef.current.removeLineClass(i, 'background', 'line-runtime-error');
    }
  }, [props.file.id]);

  const editorSectionClass = classNames({
    editor: true,
    'sidebar--contracted': !props.isExpanded
  });

  const editorHolderClass = classNames({
    'editor-holder': true,
    'editor-holder--hidden': props.file.fileType === 'folder' || props.file.url
  });

  return (
    <MediaQuery minWidth={770}>
      {(matches) =>
        matches ? (
          <section className={editorSectionClass}>
            <div className="editor__header">
              <button
                aria-label={props.t('Editor.OpenSketchARIA')}
                className="sidebar__contract"
                onClick={() => {
                  props.collapseSidebar();
                  props.closeProjectOptions();
                }}
              >
                <LeftArrowIcon focusable="false" aria-hidden="true" />
              </button>
              <button
                aria-label={props.t('Editor.CloseSketchARIA')}
                className="sidebar__expand"
                onClick={props.expandSidebar}
              >
                <RightArrowIcon focusable="false" aria-hidden="true" />
              </button>
              <div className="editor__file-name">
                <span>
                  {props.file.name}
                  <UnsavedChangesIndicator />
                </span>
                <Timer />
              </div>
            </div>
            <article
              ref={codemirrorContainerRef}
              className={editorHolderClass}
            />
            {props.file.url ? (
              <AssetPreview url={props.file.url} name={props.file.name} />
            ) : null}
            <EditorAccessibility
              lintMessages={props.lintMessages}
              currentLine={currentLine}
            />
          </section>
        ) : (
          <EditorContainer expanded={props.isExpanded}>
            <div>
              <IconButton onClick={props.expandSidebar} icon={FolderIcon} />
              <span>
                {props.file.name}
                <UnsavedChangesIndicator />
              </span>
            </div>
            <section>
              <EditorHolder ref={codemirrorContainerRef} />
              {props.file.url ? (
                <AssetPreview url={props.file.url} name={props.file.name} />
              ) : null}
              <EditorAccessibility
                lintMessages={props.lintMessages}
                currentLine={currentLine}
              />
            </section>
          </EditorContainer>
        )
      }
    </MediaQuery>
  );
}

Editor.propTypes = {
  autocloseBracketsQuotes: PropTypes.bool.isRequired,
  autocompleteHinter: PropTypes.bool.isRequired,
  lineNumbers: PropTypes.bool.isRequired,
  lintWarning: PropTypes.bool.isRequired,
  linewrap: PropTypes.bool.isRequired,
  lintMessages: PropTypes.arrayOf(
    PropTypes.shape({
      severity: PropTypes.oneOf(['error', 'hint', 'info', 'warning'])
        .isRequired,
      line: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired
    })
  ).isRequired,
  consoleEvents: PropTypes.arrayOf(
    PropTypes.shape({
      method: PropTypes.string.isRequired,
      args: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  updateLintMessage: PropTypes.func.isRequired,
  clearLintMessage: PropTypes.func.isRequired,
  updateFileContent: PropTypes.func.isRequired,
  fontSize: PropTypes.number.isRequired,
  file: PropTypes.shape({
    name: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    fileType: PropTypes.string.isRequired,
    url: PropTypes.string
  }).isRequired,
  setUnsavedChanges: PropTypes.func.isRequired,
  startSketch: PropTypes.func.isRequired,
  autorefresh: PropTypes.bool.isRequired,
  isPlaying: PropTypes.bool.isRequired,
  theme: PropTypes.string.isRequired,
  unsavedChanges: PropTypes.bool.isRequired,
  files: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      content: PropTypes.string.isRequired
    })
  ).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  collapseSidebar: PropTypes.func.isRequired,
  closeProjectOptions: PropTypes.func.isRequired,
  expandSidebar: PropTypes.func.isRequired,
  clearConsole: PropTypes.func.isRequired,
  hideRuntimeErrorWarning: PropTypes.func.isRequired,
  runtimeErrorWarningVisible: PropTypes.bool.isRequired,
  provideController: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  setSelectedFile: PropTypes.func.isRequired,
  expandConsole: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  return {
    files: state.files,
    file: selectActiveFile(state),
    htmlFile: getHTMLFile(state.files),
    ide: state.ide,
    preferences: state.preferences,
    editorAccessibility: state.editorAccessibility,
    user: state.user,
    project: state.project,
    consoleEvents: state.console,

    ...state.preferences,
    ...state.ide,
    ...state.project,
    ...state.editorAccessibility,
    isExpanded: state.ide.sidebarIsExpanded
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    Object.assign(
      {},
      EditorAccessibilityActions,
      FileActions,
      ProjectActions,
      IDEActions,
      PreferencesActions,
      UserActions,
      ConsoleActions
    ),
    dispatch
  );
}

export default withTranslation()(
  connect(mapStateToProps, mapDispatchToProps)(Editor)
);
