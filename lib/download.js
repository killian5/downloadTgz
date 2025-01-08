const ora = require("ora");
const rpj = require("read-package-json-fast");
const { buildDepStep, createNode } = require("./build-tree");
const { SAVE_PATH, SAVE_FILE_PATH, PACKAGE_PATH } = require("./constant.js");
const { delDirMkdir, mkdir } = require("../utils/index.js");

require("colors");

async function downloadPackageFile(status) {
  mkdir(SAVE_PATH);
  delDirMkdir(SAVE_FILE_PATH);
  mkdir(SAVE_FILE_PATH);
  try {
    const pkg = await readPackageJson();
    if (!pkg) {
      throw new Error("读取package.json文件失败");
    }
    const spinner = ora("正在解析package.json").start();
    const node = createNode(pkg, "package");
    spinner.stop();
    await buildDepStep([node], status);
    console.log("tgz文件全部下载完成".green);
  } catch (error) {
    console.log(error.message.red);
  }
}

async function downloadPackageName(dependencies) {
  try {
    const node = createNode({ dependencies }, "package");
    await buildDepStep([node], false);
  } catch (error) {
    console.log(error.message.red);
  }
}

async function readPackageJson() {
  try {
    const pkg = await rpj(PACKAGE_PATH);
    return pkg;
  } catch (error) {
    return null;
  }
}
module.exports = {
  downloadPackageFile,
  downloadPackageName,
};
