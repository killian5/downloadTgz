const fs = require("node:fs");
const { rimrafSync } = require("rimraf");

function delDirMkdir(path) {
  if (fs.existsSync(path)) {
    console.log(`文件夹存在，正在删除中···`.green);
    rimrafSync(path);
    console.log(`文件夹删除成功`.green);
    fs.mkdirSync(path);
  }
}

function mkdir(path) {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
}

module.exports = {
  delDirMkdir,
  mkdir,
};
