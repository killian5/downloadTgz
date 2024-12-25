const path = require("node:path");
const { program } = require("commander");
const rpj = require("read-package-json-fast");
const Config = require("@npmcli/config");
const npa = require("npm-package-arg");
const { LOCAL_PACKAGE_PATH } = require("./constant.js");
const { downloadPackageFile, downloadPackageName } = require("./download");
const {
  flatten,
  shorthands,
  definitions,
} = require("@npmcli/config/lib/definitions");

const config = new Config({
  npmPath: path.dirname(__dirname),
  argv: [...process.argv],
  definitions,
  flatten,
  shorthands,
  excludeNpmCwd: false,
});
const commands = [
  {
    flags: "-a, --all",
    description: "下载tgz依赖文件,包括peerOptional",
  },
  {
    flags: "<null>",
    description: "下载tgz依赖文件,不包括peerOptional",
  },
  {
    flags: "<name>",
    description: "下载指定依赖包,不指定版本默认为最新版本",
  },
];
module.exports = async (process) => {
  try {
    await config.load();
    const pkg = rpj(LOCAL_PACKAGE_PATH);
    program.name(pkg.name);
    program.version(pkg.version);
    for (const com of commands) {
      program.option(com.flags, com.description);
    }
    program.action(action);
    program.parse(process.argv);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
async function action(options, command) {
  const packages = command.args;
  if (packages.length > 0) {
    const dependencies = {};
    for (const item of packages) {
      const { name, rawSpec } = await npa(item);
      dependencies[name] = rawSpec;
    }
    await downloadPackageName(dependencies);
  } else {
    await downloadPackageFile(options?.all);
  }
}