const { resolve } = require("path");
const { cwd } = require("node:process");

export const SAVE_PATH = resolve(cwd(), "tgz");
export const SAVE_FILE_PATH = resolve(cwd(), "tgz/file");
export const PACKAGE_PATH = resolve(cwd(), "package.json");
export const LOCAL_PACKAGE_PATH = resolve(__dirname, "../package.json");
export const PACKAGE_LOCK_PATH =  resolve(cwd(),"package-lock.json");
