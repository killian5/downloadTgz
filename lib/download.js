import ora from "ora";
import pacote from "pacote";
import fs from "node:fs";
import path  from "node:path";
import rpj from "read-package-json-fast";

import { buildDepStep, createNode } from "./build-tree";
import { SAVE_PATH, SAVE_FILE_PATH, PACKAGE_PATH, PACKAGE_LOCK_PATH} from "./constant.js";
import { delDirMkdir, mkdir } from "../utils/index.js";
import "colors";

export async function downloadPackageFile(status) {
  mkdir(SAVE_PATH);
  delDirMkdir(SAVE_FILE_PATH);
  mkdir(SAVE_FILE_PATH);
  try {
    const pkg = await readPackageJson();
    if (!pkg) {
      throw new Error("读取package.json文件失败");
    }
    spinner.text = `"`;
    console.log("正在解析package.json".green);
    const node = createNode(pkg, "package");
    await buildDepStep([node], status);
    console.log("tgz文件全部下载完成".green);
  } catch (error) {
    console.log(error.message.red);
  }
}

export async function downloadPackageName(dependencies) {
  try {
    const node = createNode({ dependencies }, "package");
    await buildDepStep([node], false);
  } catch (error) {
    console.log(error.message.red);
  }
}

export async function downloadPackageLock() {
  const spinner = ora('开始执行tgz命令\n').start();
  mkdir(SAVE_PATH);
  delDirMkdir(SAVE_FILE_PATH);
  mkdir(SAVE_FILE_PATH);
  try {
    const tarballs = [];
    try {
      spinner.text = "正在读取package-lock.json";
      const lockFile = fs.readFileSync(PACKAGE_LOCK_PATH);
      const lockFileObj = JSON.parse(lockFile);
      spinner.text = `正在解析package-lock.json"`;
      recursionPackage( tarballs, lockFileObj.packages ?? lockFileObj.dependencies)
      spinner.text = `package-lock.json 解析完成,准备下载tgz`;
    } catch (error) {
      throw new Error("读取package-lock.json文件失败")
    }
    for(const {url, version} of tarballs){
      const packName = url
      .split(".tgz")[0]
      .split("/-/")[1]
      .replace(`-${version}`, "");
      try {
        spinner.text = `${packName} ${version}开始下载`;
        const _path = path.resolve(SAVE_FILE_PATH, `${packName}-${version}.tgz`);
        const data = await pacote.tarball(url);         
        fs.writeFileSync(_path, data);
        spinner.text = `${packName} ${version}下载完成`;
      } catch (error) {
        console.log(file.url, '失败');
      }
    }
    spinner.color = 'green';
    spinner.text = "tgz文件全部下载完成";
    spinner.stop();
  } catch (error) {
    spinner.stop();
    console.log(error.message.red);
   
  }  
}


function recursionPackage(tarballs, dependencies){
  for (const [dependencyName, dependency] of Object.entries(dependencies)) {
    if (dependency.resolved) {
      tarballs.push({
        version: dependency.version,
        url: dependency.resolved,
        directory: dependencyName,
      });
    }
    if (dependency.dependencies) {
      recursionPackage(tarballs, dependency.dependencies);
    }
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
