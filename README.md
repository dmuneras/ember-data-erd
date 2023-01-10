ember-data-erd
==============================================================================

Small library to generate entity relationship models using the Ember data
models of the app as source.

This project is inspired in `rails-erd` (https://github.com/voormedia/rails-erd).
But needs more work to get to that point and support new Ember applications.

![](https://i.imgur.com/OTXG5RO.png)

Installation
------------------------------------------------------------------------------

```
ember install ember-data-erd

```

Compatibility
------------------------------------------------------------------------------

The library has basic supports for the following ways to define models:

```js
  export default Model.extend({
    name: attr()
  }
```

```js
  import Model, { attr, hasMany } from '@ember-data/model';

  export default class ClientModel extends Model {
    @attr name;

    @hasMany pets;
  }
```

```js
  import Model, { attr, hasMany } from '@ember-data/model';

  export default class ClientModel extends Model {
    @attr name;

    @hasMany('pet') pets;
  }
```

```js
  import Model, { attr, hasMany } from '@ember-data/model';

  export default class ClientModel extends Model {
    @attr name;

    @hasMany('pet')
    pets;
  }
```

This is still in a very early stage, so, errors parsing the source code might
happen. If you find one, please report it as an issue in the repo.

Thanks!


Usage
------------------------------------------------------------------------------

Run the following command in the root of the project.

```
  ember erd:generate
```

By default the library is going to generate a PNG image in a diagrams
folder. If the diagrams folder is not created, it will be created in the
root folder of the project.

In order to modify the behaviour of the library it is possible to use a
configuration file. The configuration file should be called:

`.ember-data-erd.js`

Create the file and put it in the root directory of the project.

The supported options are:

- include : Array with the camelCased names of the models to include in the
  diagram.
- outputFormat: The format of the ouput file that Graphviz should render
  (https://www.graphviz.org/doc/info/output.html).


**Example config file:**

```js
  module.exports = {
    include: [
      'board',
      'organisation',
      'link',
      'reward',
      'user',
      'userGroup'
    ],
    outputFormat: 'pdf',
    graphviz: {
      concentrate: false // https://graphviz.org/doc/info/attrs.html#d:concentrate
    }
  }
```

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
