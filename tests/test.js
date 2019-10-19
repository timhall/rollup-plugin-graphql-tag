const { join } = require('path');
const rollup = require('rollup');
const gql = require('../');

it('should load and transform simple graphql queries', async () => {
  const code = await compile(fixture('simple.js'));
  expect(code).toMatchSnapshot();
});

it('should load and transform graphql schema', async () => {
  const code = await compile(fixture('schema.js'));
  expect(code).toMatchSnapshot();
});

// TODO
// it('should load and transform queries with imports', async () => {
//   const code = await compile(fixture('complex.js'));
//   expect(code).toMatchSnapshot();
// });

// TODO
// it('should load and transform queries as separate exports', async () => {
//   const code = await compile(fixture('multiple.js'));
//   expect(code).toMatchSnapshot();
// });

function fixture(path) {
  return join(__dirname, '__fixtures__', path);
}

async function compile(input) {
  const bundle = await rollup.rollup({
    input,
    plugins: [gql()]
  });

  const { output } = await bundle.generate({
    format: 'es'
  });
  const chunks = output.map(chunk => chunk.code);

  return chunks.length > 1 ? chunks : chunks[0];
}
