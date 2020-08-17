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

function getReferenceNames(node: any) {
    const references = [];

    // Check node
    if (node.kind === 'FragmentSpread') {
        references.push(node.name.value);
    } else if (node.kind === 'VariableDefinition' && node.type.kind === 'NamedType') {
        references.push(node.type.name.value);
    }

    // Check related data
    const nodesToCheck = [];
    if (node.selectionSet) nodesToCheck.push(...node.selectionSet.selections);
    if (node.variableDefinitions) nodesToCheck.push(...node.variableDefinitions);
    if (node.definitions) nodesToCheck.push(...node.definitions);

    nodesToCheck.forEach(node => {
        references.push(...getReferenceNames(node));
    });

    return references;
}

function compile(data: string): string {
  // 1. Extract imports
  // TODO https://github.com/apollographql/graphql-tag/blob/50a850e484a60d95ddb99801c39785031e55b7a2/loader.js#L29
  const imports = '';

  // 2. Compile graphql document as default export
  const doc = gql`
    ${data}
  `;
  const defaultExport: string = dedent`
    export default (function() {
      const doc = ${JSON.stringify(doc)};
      doc.loc.source = ${JSON.stringify(doc.loc.source)};

      return doc;
    })();
  `;

  // 3. Extract operations into named exports
  const namedOperations: { [name: string]: any } = {};
  const indexedDefinitions: Record<string, any> = {};
  doc.definitions.forEach((definition: any) => {
    if (definition.name) {
      indexedDefinitions[definition.name.value] = definition;
    }
  });

  for (const definition of doc.definitions) {
    if (definition.kind !== 'OperationDefinition' || !definition.name) continue;

    const name = definition.name.value;
    if (!name || namedOperations[name]) continue;

    // Extract sub-document
    const document: { kind: string, definitions: any[], loc?: any } = { kind: doc.kind, definitions: [definition] };
    if (doc.hasOwnProperty('loc')) document.loc = doc.loc;

    const references: Record<string, any> = {};
    getReferenceNames(document).forEach(name => {
      const reference = indexedDefinitions[name];
      if (reference) references[name] = reference;
    });
    document.definitions.push(...Object.values(references));
    namedOperations[name] = document;
  }
  const namedExports = Object.entries(namedOperations)
    .map(([name, document]) => {
      return dedent`
        export const ${name} = ${JSON.stringify(document)};
      `;
    })
    .join('\n');

  // 4. Combine module
  return [imports, defaultExport, namedExports].filter(Boolean).join('\n\n');
}
