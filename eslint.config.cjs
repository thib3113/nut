const eslintConfigPrettier = require('eslint-config-prettier');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');
const typescriptParser = require('@typescript-eslint/parser')

module.exports = [
    eslintPluginPrettierRecommended,
    eslintConfigPrettier,
    {
        languageOptions: {
            parser: typescriptParser,
            ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
            sourceType: 'module' // Allows for the use of imports
        },
        ignores: ['*.hbs', '*.md', '*.html'],
        rules: {
            camelcase: 'off',
            '@typescript-eslint/camelcase': 'off',
            '@typescript-eslint/interface-name-prefix': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            indent: 'off', //prettier take it in charge
            '@typescript-eslint/no-object-literal-type-assertion': 'off',
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/ban-ts-ignore': 'off'
        }
    }
];
