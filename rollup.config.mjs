import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
export default {
  input: "./bin/run.js", // 入口文件
  output: {
    file: "./dist/bundle.js", // 出口文件
    inlineDynamicImports: true,
    format: "cjs",
  },
  plugins: [
    json(),
    nodeResolve(), // 解析npm模块
    commonjs(), // 将CommonJS模块转为可被Rollup处理的格式
  ],
};
