# npm-install-tmp

Temporary installs a npm package and automatically cleans up the resources afterwards.

## Installation

```sh
npm install npm-install-tmp --save
```

## Usage

```
import {use} from 'npm-install-tmp';

// Pass the name of the package you want to include (e.g. example or example@latest)
use('example')
    .then(example => {
        // do what ever you want
    });
```

After the process exited all the resource are cleaned up automatically.

## Tests

```sh
npm install
npm test
```

## Dependencies

- [@types/node](https://www.github.com/DefinitelyTyped/DefinitelyTyped.git): TypeScript definitions for Node.js
- [npm](https://github.com/npm/npm): a package manager for JavaScript
- [tmp](): Temporary file and directory creator

## Dev Dependencies

- [rimraf](): A deep deletion module for node (like `rm -rf`)
- [tslint](https://github.com/palantir/tslint): An extensible static analysis linter for the TypeScript language
- [typescript](https://github.com/Microsoft/TypeScript): TypeScript is a language for application scale JavaScript development


## License

MIT
