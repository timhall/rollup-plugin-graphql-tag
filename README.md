__Deprecated__: Rollup has since released an [official graphql plugin](https://github.com/rollup/plugins/tree/master/packages/graphql), `@rollup/plugin-graphql`, please use that instead. 
# rollup-plugin-graphql-tag

Import and preprocess graphql documents using `graphql-tag` with `rollup`.

```graphql
# src/schema.graphql
type Book {
  title: String
  author: Author
}

type Author {
  name: String
  books: [Book]
}

type Query {
  getBooks: [Book]
  getAuthors: [Author]
}
```

```js
// src/index.js
import { ApolloServer } from 'apollo-server';
import typeDefs from './schema.graphql';
import * as resolvers from './resolvers';

const server = new ApolloServer({ typeDefs, resolvers });
```

```js
import gql from 'rollup-plugin-graphql-tag';

export default {
  input: 'src/index.js',
  output: 'dist/index.js',
  plugins: [gql()]
};
```
