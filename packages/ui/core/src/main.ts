import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import * as monaco from 'monaco-editor';
import { configureMonacoYaml } from 'monaco-yaml';
import { AppModule } from './app/app.module';
import { environment } from '@activepieces/ui/common';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/shell/shell';
import 'codemirror/addon/display/autorefresh';
import 'prismjs';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-sass';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import * as editorWorkerService from 'monaco-editor/esm/vs/editor/editor.worker';
import * as stylesWorkerService from 'monaco-editor/esm/vs/language/css/css.worker';
import * as htmlWorkerService from 'monaco-editor/esm/vs/language/html/html.worker';
import * as jsonWorkerService from 'monaco-editor/esm/vs/language/json/json.worker';
import * as tsWorkerService from 'monaco-editor/esm/vs/language/typescript/ts.worker';
import * as yamlWorkerService from 'monaco-yaml/yaml.worker';
configureMonacoYaml(monaco, {});

window.MonacoEnvironment = {
  getWorker(moduleId, label) {
    switch (label) {
      case 'editorWorkerService':
        return new Worker(editorWorkerService);
      case 'css':
      case 'less':
      case 'scss':
        return new Worker(stylesWorkerService);
      case 'handlebars':
      case 'html':
      case 'razor':
        return new Worker(htmlWorkerService);
      case 'json':
        return new Worker(jsonWorkerService);
      case 'javascript':
      case 'typescript':
        return new Worker(tsWorkerService);
      case 'yaml':
        return new Worker(yamlWorkerService);
      default:
        throw new Error(`Unknown label ${label}`);
    }
  },
};

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
