import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import * as url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json').toString());

const dist = path.join(__dirname, tsConfig.compilerOptions.outDir);

if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
}

let makeAllPackagesExternalPlugin = {
    name: 'make-all-packages-external',
    setup(build) {
        let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/; // Must not start with "/" or "./" or "../"
        build.onResolve({ filter }, (args) => ({ path: args.path, external: true }));
    }
};

const baseDir = process.env.INIT_CWD;
const PACKAGE_JSON_PATH = path.join(baseDir, 'package.json');

const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH).toString());

if (!pkg?.name) {
    throw new Error(`fail to read package.json`);
}
fs.writeFileSync(path.join(baseDir, 'src', 'pkg.ts'), `// THIS FILE IS GENERATED ON BUILD - DO NOT EDIT MANUALLY\nexport const pkg = { name: '${pkg.name}', version: '${pkg.version}' };\n`);

esbuild
    .build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        sourcemap: true,
        minify: true,
        external: [],
        plugins: [makeAllPackagesExternalPlugin],
        outdir: dist,
        splitting: true,
        metafile: true,
        format: 'esm',
        outExtension: { '.js': '.mjs' },
        target: ['esnext']
    })
    .catch(() => process.exit(1));
