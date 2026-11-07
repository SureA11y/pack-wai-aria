'use strict';

module.exports = [
  { languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs' } },
  {
    // Old libraries (Prototype, MooTools) replace Array.from with one that
    // drops Sets, Map iterators and the mapping function, and core stops a
    // scan of such a page when a rule that runs uses it. Spread goes through
    // the iterators, which they leave alone.
    files: ['rules/**/*.js'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Array',
          property: 'from',
          message: 'A page can replace Array.from: use spread ([...x], [...x].map(f)).'
        }
      ]
    }
  },
  { ignores: ['node_modules/**'] }
];
