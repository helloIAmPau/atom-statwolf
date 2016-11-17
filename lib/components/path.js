'use babel';

import resolver from '../utils/tree-path-resolver';
import path from '../utils/safe-path';
import rootPath from '../utils/root-path-finder';
import n from '../utils/notifications';
import fs from 'fs-plus';
import View from '../views/modal-text';

const open = function(statwolfPath) {

  statwolfPath = statwolfPath.split('.');
  statwolfPath.push(statwolfPath[statwolfPath.length -1]);
  statwolfPath = statwolfPath.join(path.sep);
  statwolfPath = path.join(rootPath(), statwolfPath);

  var exists = ['.js', '.json', '.r', '.py', '.csx'].some(function(suffix) {
    if(!fs.isFileSync(statwolfPath + suffix)) return false;

    statwolfPath = statwolfPath + suffix;
    return true;
  });

  if(!exists) {
    n.error('Statwolf path', 'Wrong path provided.');
    return;
  }

  atom.workspace.open(statwolfPath);

};

export default function(d) {

  const onPath = atom.commands.add('atom-workspace', {
    'statwolf:copyPath': function(event) {
      const relativePath = resolver(event.target, true);

      if(relativePath === null) {
        n.error('Statwolf path', 'Not a Statwolf module', true);
        return;
      }

      atom.clipboard.write(relativePath.replace(new RegExp('\\' + path.sep, 'g'), '.'));
      n.info('Statwolf path', 'Path copied into clipboard');
    },
    'statwolf:openPath': function(event) {
      const view = new View('Insert a Statwolf path');
      const panel = atom.workspace.addModalPanel({ item: view });

      view.on('exit', function() {
        panel.destroy();
      });

      view.on('confirm', function(statwolfPath) {
        view.emit('exit');

        open(statwolfPath);
      });
    }
  });
  d.add(onPath);

  const clickHandler = atom.workspace.observeTextEditors(function(editor) {
    const view = editor.element;

    view.addEventListener('dblclick', function(event) {

      if(!event.ctrlKey) {
        return;
      }

      const row = editor.getCursorBufferPosition().row;
      const text = editor.getTextInRange([ [ row, 0 ], [ row, Infinity ] ]).match(/Statwolf\.([a-zA-Z0-9\_\-]+\.?)*/);

      if(!text) {
        return;
      }

      open(text[0]);
    });

  });
  d.add(clickHandler);

  const componentHandler = atom.workspace.observeTextEditors(function(editor) {
    let filePath = path.sanitize(editor.getPath());

    if(!filePath || !filePath.startsWith(rootPath())) {
      return;
    }

    const view = editor.element;

    view.addEventListener('keydown', function(event) {

      if(!event.ctrlKey || !event.altKey) {
        return;
      }

      switch(event.code) {
        case 'Digit8':
          filePath = filePath.split('.').slice(0, 1).concat([ 'js' ]).join('.');
          break;
        case 'Digit9':
          filePath = filePath.split('.').slice(0, 1).concat([ 'test', 'js' ]).join('.');
          break;
        case 'Digit0':
          filePath = filePath.split('.').slice(0, 1).concat([ 'deps', 'json' ]).join('.');
          break;
        default:
          return;
      }

      if(!fs.existsSync(filePath)) {
        return;
      }

      atom.workspace.open(filePath);
    });

  });
  d.add(componentHandler);

  console.log('Statwolf paths ready.');
};