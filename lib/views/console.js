'use babel';

import conf from '../utils/configurations';
import n from '../utils/notifications';
import disposable from '../utils/disposable';
import CircularJSON from 'circular-json';

const OUTPUT_NAME='fkwejlbfwekrjbgfikur3bgbgrebg3gerfhb';
//const OUTPUT_PATH='statwolf:/console-output';
//const OUTPUT_PATH_WIN = 'statwolf:\\console-output';
const LOG_NAME='243o85rhewq9wujrfzlksdfngrweglw';
//const LOG_PATH='statwolf:/console-log';
//const LOG_PATH_WIN = 'statwolf:\\console-log';

let outputBuffers = [];
let logBuffers = [];

export default class {

  constructor(output) {
    this.data = Object.assign({
      logs: [],
      error: null,
      output: ''
    }, output.getData());
    output.on('change', (store) => {
      this.data = store;

      this.update(true);
    });

    const onEditor = () => {
      return atom.workspace.observeTextEditors((editor) => {
        let onDestroy;
        let title;

        switch(editor.getFileName()) {
          case OUTPUT_NAME:
            outputBuffers.push(editor);
            onDestroy = editor.onDidDestroy(function() {
              outputBuffers = outputBuffers.filter(function(item) {
                return item !== editor;
              });
              onDestroy.dispose();
            });
            const jsGrammar = atom.grammars.grammars.find(function(grammar) {
              return grammar.name === 'JavaScript';
            });
            editor.setGrammar(jsGrammar);
            title = 'statwolf://console-output';
            break;
          case LOG_NAME:
            logBuffers.push(editor);
            onDestroy = editor.onDidDestroy(function() {
              logBuffers = logBuffers.filter(function(item) {
                return item !== editor;
              });
              onDestroy.dispose();
            });
            title = 'statwolf://console-log';
            break;
          default:
            return;
        }

        editor.save = function() {
          n.info('Statwolf console', 'Save keybinding disabled on this buffer. Use Save As instead.');
        };

        editor.getTitle = editor.getLongTitle = function() {
          return title;
        };
        editor.emitter.emit('did-change-title', editor.getTitle());

        this.update(false);
      });
    };
    disposable(onEditor);
  }

  update(create) {
    create = create || false;

    if(outputBuffers.length === 0 && create) {
      atom.workspace.open(OUTPUT_NAME);
    }
    if(logBuffers.length === 0 && create) {
      atom.workspace.open(LOG_NAME);
    }
    if(outputBuffers.length === 0 || logBuffers.length === 0) {
      return;
    }

    let outputText;
    if(this.data.error) {
      outputText = `${ this.data.error.message }\n\n${ this.data.error.stack }`;
    }
    else {
      outputText = this.data.output;
    }

    if(outputText === null) {
      outputText = 'null';
    }
    else if(outputText === undefined) {
      outputText = 'undefined';
    }
    else if(typeof outputText === 'number' || typeof outputText === 'boolean' || typeof outputText === 'function') {
      outputText = outputText.toString();
    }
    else if(typeof outputText === 'object') {
      outputText = CircularJSON.stringify(outputText, null, 2);
    }

    if(outputText.length > conf.outputBufferLength) {
      outputText = `${ outputText.substring(0, conf.outputBufferLength) }\n...`;
    }
    outputBuffers.forEach(function(buffer) {
      buffer.setText(outputText);
    });

    let logText = this.data.logs.map(function(item) {
      return item.msg;
    }).join('\n')
    if(logText.length > conf.outputBufferLength) {
      logText = `${ logText.substring(0, conf.outputBufferLength) }\n...`;
    }
    logBuffers.forEach(function(buffer) {
      buffer.setText(logText)
    });

  }

}
