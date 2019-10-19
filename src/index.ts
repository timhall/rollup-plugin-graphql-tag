import dedent from '@timhall/dedent/macro';
import { readFileSync } from 'fs';
import gql from 'graphql-tag';
import { extname } from 'path';
import { createFilter } from 'rollup-pluginutils';

const extensions = ['.graphql', '.gql'];
const isGraphql = (path: string) => extensions.includes(extname(path));

interface Options {
  include?: string | RegExp | Array<string | RegExp>;
  exclude?: string | RegExp | Array<string | RegExp>;
}
interface Plugin {
  name: string;
  load(id: string): null | string;
}

export default function graphqlTag(options: Options = {}): Plugin {
  const filter = createFilter(options.include, options.exclude);

  return {
    name: 'graphql-tag',

    load(id) {
      if (!filter(id) || !isGraphql(id)) return null;

      // Convert raw data to graphql module
      const data = readFileSync(id, 'utf8');
      const source = compile(data);

      return source;
    }
  };
}

function compile(data: string): string {
  // 1. Extract imports
  // TODO https://github.com/apollographql/graphql-tag/blob/50a850e484a60d95ddb99801c39785031e55b7a2/loader.js#L29
  const imports = '';

  // 2. Compile graphql document as default export
  const doc = gql`
    ${data}
  `;
  const default_export: string = dedent`
    export default (function() {
      const doc = ${JSON.stringify(doc)};
      doc.loc.source = ${JSON.stringify(doc.loc.source)};

      return doc;
    })();
  `;

  // 3. Extract operations into named exports
  const named_operations: { [name: string]: any } = {};
  for (const definition of doc.definitions) {
    if (definition.kind !== 'OperationDefinition' || !definition.name) continue;

    const name = definition.name.value;
    if (!name || named_operations[name]) continue;

    // Extract sub-document
    // TODO https://github.com/apollographql/graphql-tag/blob/50a850e484a60d95ddb99801c39785031e55b7a2/loader.js#L69
  }
  const named_exports = Object.entries(named_operations)
    .map(([name, document]) => {
      return dedent`
        export const ${name} = ${JSON.stringify(document)};
      `;
    })
    .join('\n');

  // 4. Combine module
  return [imports, default_export, named_exports].filter(Boolean).join('\n\n');
}
