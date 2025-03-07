# w-tgz 下载所有依赖tgz

[![npm version](https://img.shields.io/npm/v/npm.svg)](https://npm.im/npm)

由于内网没有所需要的npm包，所以需要在外网下载所有的npm包，但是下载的npm有时候还是会有缺失，只通过package-lock.json下载可能不太全面。tgz是通过npm install 命令的原理,重新下载所有的依赖包



### 安装

```bash
npm install w-tgz -g
```

### 命令
#### 1.下载所有依赖tgz(不包括peerOptional)
```bash
tgz
```
#### 2.下载所有依赖tgz(包括peerOptional)
```bash
tgz -a
```
#### 3.下载指定的依赖包(不包括peerOptional)
```bash
tgz <vue | vue@0.0.0>
```
#### 4.下载package-lock.json下的所有tgz
```bash
tgz -l
```
