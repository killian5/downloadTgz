const fs = require("node:fs");
const { cwd } = require("node:process");
const { resolve } = require("node:path");
const pacote = require("pacote");
const npa = require("npm-package-arg");
const rpj = require("read-package-json-fast");
const { rimrafSync } = require("rimraf");

const { callLimit: promiseCallLimit } = require("promise-call-limit");

const options = {
  nodeVersion: "v18.11.0",
  registry: "https://registry.npmmirror.com/",
};
const log = console.log;
const savedPath = resolve(cwd(), "tgz");
const dirPath = resolve(cwd(), "tgz/file");

function delDirectory(path) {
  if (fs.existsSync(path)) {
    log(
      `${path} \u6587\u4EF6\u5939\u5B58\u5728\uFF0C\u6B63\u5728\u5220\u9664\u4E2D\xB7\xB7\xB7`
    );
    rimrafSync(path);
    log(`${path} \u6587\u4EF6\u5939\u5220\u9664\u6210\u529F`);
  }
}
// deps
async function initTree() {
  const pkg = await rpj("./src/package.json");
  if (!fs.existsSync(savedPath)) {
    fs.mkdirSync(savedPath);
  }
  delDirectory(dirPath);
  fs.mkdirSync(dirPath);
  const node = createNode(pkg, "package");
  const promises = await buildDepStep([], [node]);

  promiseCallLimit(promises);
}

async function buildDepStep(promises, depsQueue) {
  if (!depsQueue.length) {
    return promises;
  }
  const node = depsQueue.pop();
  node.resolved && promises.push(() => downloadTgz(node));
  for (const edge of problemEdges(node)) {
    const dep = await nodeFromEdge(edge, node);
    depsQueue.push(dep);
  }
  return buildDepStep(promises, depsQueue);
}

async function nodeFromEdge(edge, parent) {
  const spec = npa.resolve(edge.name, edge.spec);
  const node = await nodeFromSpec(spec);
  node.parent = parent;
  return loadPeerSet(node);
}

async function nodeFromSpec(spec) {
  const mani = await pacote.manifest(spec, options);
  const node = createNode(mani);
  node.escapedName = spec.escapedName;
  return node;
}

async function downloadTgz(node) {
  const { resolved, name, version } = node;
  const data = await pacote.tarball(resolved);
  const newName = name.replace("/", "-");
  const _path = resolve(dirPath, `${newName}-${version}.tgz`);
  fs.writeFileSync(_path, data);
}

async function loadPeerSet(node) {
  const peerEdges = [...node.edgesOut.values()].filter((e) => {
    return e.peer;
  });
  for (const edge of peerEdges) {
    const parentEdge = node.parent.edgesOut.get(edge.name);
    if (!parentEdge) {
      await nodeFromEdge(edge, node.parent);
      continue;
    } else {
      await nodeFromEdge(parentEdge, node.parent);
    }
  }

  return node;
}

function problemEdges(node) {
  const problems = [];

  for (const edge of node.edgesOut.values()) {
    const name = toName(edge.form, edge.name);

    if (name === null && edge.type !== "peerOptional") {
      edge.form.children.set(edge.name, edge);
      problems.push(edge);
    }
  }
  return problems;
}
function createNode(props, isPackage) {
  const {
    name,
    version,
    dependencies,
    devDependencies,
    peerDependenciesMeta = {},
    optionalDependencies,
    _resolved = null,
  } = props;
  const node = {
    name,
    version,
    to: null,
    parent: null,
    resolved: _resolved,
    children: new Map(),
    edgesOut: new Map(),
  };
  const pd = props.peerDependencies;
  if (pd && typeof pd === "object") {
    const peerOptional = {};
    const peerDependencies = {};
    for (const [name, dep] of Object.entries(pd)) {
      if (peerDependenciesMeta[name]?.optional) {
        peerOptional[name] = dep;
      } else {
        peerDependencies[name] = dep;
      }
    }
    loadDepType(peerDependencies, node, "peer");
    loadDepType(peerOptional, node, "peerOptional");
  }
  if (isPackage) {
    loadDepType(devDependencies, node, "dev");
  }
  loadDepType(dependencies, node, "prod");
  loadDepType(optionalDependencies, node, "optional");
  return node;
}
function loadDepType(deps, node, type) {
  for (const [name, spec] of Object.entries(deps || {})) {
    const current = node.edgesOut.get(name);

    if (!current) {
      node.edgesOut.set(name, { name, spec, type, form: node });
    }
  }
}
function toName(node, name) {
  const mine = node?.children?.get(name);
  if (mine) {
    return mine;
  }

  const resolveParent = node.parent;
  if (resolveParent) {
    return toName(resolveParent, name);
  }
  return null;
}
initTree();
