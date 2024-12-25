const { resolve } = require("path");
const { cwd } = require("node:process");

const SAVE_PATH = resolve(cwd(), "tgz");
const SAVE_FILE_PATH = resolve(cwd(), "tgz/file");
const PACKAGE_PATH = resolve(cwd(), "package.json");
const LOCAL_PACKAGE_PATH = resolve(__dirname, "../package.json");

module.exports = {
  SAVE_PATH,
  PACKAGE_PATH,
  SAVE_FILE_PATH,
  LOCAL_PACKAGE_PATH,
};
