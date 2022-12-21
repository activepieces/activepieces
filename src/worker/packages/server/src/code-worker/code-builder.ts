import decompress = require("decompress");
import {sandboxManager} from "../helper/sandbox";

const {execSync} = require("child_process");
const fs = require("fs");

const webpackConfig: string = "const path = require('path');\n" +
    "module.exports = {\n" +
    "  target: 'node',\n" +
    "  externalsPresets: { node: true },\n" +
    "  entry: './index.js', // make sure this matches the main root of your code \n" +
    "  resolve: {\n" +
    "     preferRelative: true,\n" +
    "     extensions: ['.js']\n" +
    "  },\n" +
    "  output: {\n" +
    "    libraryTarget: 'commonjs2',\n" +
    "    path: path.join(__dirname, 'dist'), // this can be any path and directory you want\n" +
    "    filename: 'index.js',\n" +
    "  },\n" +
    "  optimization: {\n" +
    "    minimize: true, // enabling this reduces file size and readability\n" +
    "  },\n" +
    "};\n";

async function build(artifact: Buffer): Promise<Buffer> {
    let sandbox = sandboxManager.obtainSandbox();
    let buildPath = sandbox.getSandboxFolderPath();
    let bundledFile = undefined;
    try {
        console.log("Started Building in sandbox " + buildPath);

        sandbox.cleanAndInit();

        await decompress(artifact, buildPath, {});
        await prepareSandbox(buildPath);

        const installResult = await execSync("npm --prefix " + buildPath + " install");
        const buildResult = await execSync("npm --prefix " + buildPath + " run build");

        let bundledFilePath = buildPath + "/dist/index.js";
        if (fs.existsSync(bundledFilePath)) {
            bundledFile = fs.readFileSync(bundledFilePath);
        } else {
            let invalidArtifactFile = fs.readFileSync("resources/invalid-code.js").toString("utf-8")
                .replace("${ERROR_MESSAGE}", buildResult);
            bundledFile = Buffer.from(invalidArtifactFile, "utf-8");
        }
        console.log("Finished Building in sandbox " + buildPath);
    } finally {
        sandboxManager.returnSandbox(sandbox.boxId);
    }
    return bundledFile;
}

async function prepareSandbox(buildPath: string){
    const packageJson = JSON.parse(fs.readFileSync(buildPath + '/package.json', {encoding: 'utf8', flag: 'r'}));
    packageJson.scripts['build'] = 'webpack --mode production';
    fs.writeFileSync(buildPath + "/package.json", JSON.stringify(packageJson));
    fs.writeFileSync(buildPath + "/webpack.config.js", webpackConfig);
}

export const CodeBuilder = {
    build: build
}