import fs from "node:fs";
import ora from "ora";
import pacote from "pacote";
import npa from "npm-package-arg";
import { resolve } from "node:path";
import { callLimit } from "promise-call-limit";

const { SAVE_FILE_PATH } = require("../lib/constant");
const spinner = ora();

export async function buildDepStep(depsQueue, status) {
  const promises = [];
  if (!depsQueue.length) {
    spinner.stop();
    return;
  }
  const node = depsQueue.pop();
  for (const edge of problemEdges(node, status)) {
    const dep = await nodeFromEdge(edge, node);
    dep.resolved && promises.push(() => downloadTgz(dep));
    depsQueue.push(dep);
  }
  await callLimit(promises);
  return buildDepStep(depsQueue, status);
}

async function nodeFromEdge(edge, parent) {
  const spec = npa.resolve(edge.name, edge.spec);
  const node = await nodeFromSpec(spec);
  node.parent = parent;
  return loadPeerSet(node);
}

async function nodeFromSpec(spec) {
  const { version, env } = process;
  const options = {
    nodeVersion: version,
    registry: env.npm_config_registry || "https://registry.npmmirror.com",
  };
  const mani = await pacote.manifest(spec, options);
  const node = createNode(mani);
  node.escapedName = spec.escapedName;
  return node;
}

async function downloadTgz(node) {
  const { resolved, name, version } = node;
  spinner.text = `下载中${name} ${version}`;
  spinner.start();
  const data = await pacote.tarball(resolved);
  const newName = name.replace("/", "-");
  const _path = resolve(SAVE_FILE_PATH, `${newName}-${version}.tgz`);
  fs.writeFileSync(_path, data);
  spinner.text = `${name} ${version}下载完成`;
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

function problemEdges(node, status) {
  const problems = [];

  for (const edge of node.edgesOut.values()) {
    const name = toName(edge.form, edge.name);

    if (name === null && (edge.type !== "peerOptional" || status)) {
      edge.form.children.set(edge.name, edge);
      problems.push(edge);
    }
  }
  return problems;
}
export function createNode(props, isPackage) {
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
