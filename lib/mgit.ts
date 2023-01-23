import * as c from "https://deno.land/std@0.173.0/fmt/colors.ts";
import { walk } from "https://deno.land/std@0.173.0/fs/walk.ts";
import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import $ from "https://deno.land/x/dax@0.24.1/mod.ts";
import * as JSONC from "https://deno.land/std@0.173.0/encoding/jsonc.ts";

// these are typically used by consumers of this library so make them accessible
export * as colors from "https://deno.land/std@0.173.0/fmt/colors.ts";
export * as fs from "https://deno.land/std@0.173.0/fs/mod.ts";
export * as JSONC from "https://deno.land/std@0.173.0/encoding/jsonc.ts";
export * as path from "https://deno.land/std@0.173.0/path/mod.ts";
export * as dax from "https://deno.land/x/dax@0.24.1/mod.ts";
export { $ } from "https://deno.land/x/dax@0.24.1/mod.ts";

/**
 * TODO: document all interfaces, fields, and functions so that VS Code editor
 * can act as our primary documentation for `ws-ensure.ts` scripts
 */

export interface WorkspaceContext {
  readonly workspaceFsHome: string;
  readonly handled: WorkspaceRepo[];
  readonly vsCodeWsPathMatchers: RegExp[];
  readonly debug?: boolean;
}

export interface WorkspaceRepo {
  readonly wsContext: WorkspaceContext;
  readonly repoUrlWithoutScheme: string;
  readonly repoURL: URL;
  readonly repoFsHomeAbs: string;
  readonly repoFsHomeRel: string;
  readonly pp: path.ParsedPath;
  readonly stat?: Deno.FileInfo;
}

export function defaultWorkspaceFsHome() {
  return Deno.env.get("MANAGED_GIT_WORKSPACES_HOME") || Deno.cwd();
}

export function strictVsCodeWsPathMatchers() {
  return [/.mgit.code-workspace$/];
}

export function relaxedVsCodeWsPathMatchers() {
  return [/.code-workspace$/];
}

/**
 * Prepare a workspace context to track work across multiple mGit repos in the
 * same workspace.
 * @param workspaceFsHome absolute path of the managed workspaces root
 * @param vsCodeWsPathMatchers the regEx's that will determine whether a file is candidate mGit VS Code `.code-workspace` file
 * @param handled which repos have already been handled (so we don't end up with recursive loops in case repos depend on each other)
 * @returns workspace context that should be passed into {@link workspaceRepo} function
 */
export function workspaceContext(
  workspaceFsHome = defaultWorkspaceFsHome(),
  vsCodeWsPathMatchers = strictVsCodeWsPathMatchers(),
  handled: WorkspaceRepo[] = [],
): WorkspaceContext {
  return { workspaceFsHome, vsCodeWsPathMatchers, handled };
}

/**
 * Prepare a workspace repo instance that can be passed to other functions like {@link ensureRepo}.
 * @param repoUrlWithoutScheme a URL-like string (e.g. "github.com/org/repo")
 * @param wsContext the workspace context in which we're operating
 * @returns a workspace repo instance
 */
export async function workspaceRepo(
  repoUrlWithoutScheme: string,
  wsContext = workspaceContext(),
) {
  const repoFsHomeAbs = path.join(
    wsContext.workspaceFsHome,
    repoUrlWithoutScheme,
  );
  const pp = path.parse(repoFsHomeAbs);
  const result: WorkspaceRepo = {
    wsContext,
    repoUrlWithoutScheme,
    repoURL: new URL(`https://${repoUrlWithoutScheme}`),
    repoFsHomeAbs,
    repoFsHomeRel: path.relative(wsContext.workspaceFsHome, repoFsHomeAbs),
    pp,
  };
  try {
    const stat = await Deno.stat(repoFsHomeAbs);
    return { ...result, stat };
  } catch (_err) {
    return result;
  }
}

/**
 * Either `git clone` or `git pull` a repo to ensure that it exists in the local file system.
 * @param repo the repo we want to prepare
 * @param options how we want to prepare the repo
 * @returns
 */
export async function ensureRepo(
  repo: WorkspaceRepo,
  options?: {
    /** if the repo already exists, don't do a pull and instead delete the existing repo without confirmation and then do a fresh clone */
    readonly force?: boolean;
    /** if set, we won't try to find `*.code-workspace` files to symlink them in the workspace home */
    readonly skipMgitVsCodeWsAutoDetect?: boolean;
    /** if set, we will find dependent repos by looking in `*.code-workspace` files' `.folders[].path` configuration  */
    readonly ensureVscWsDepsFolders?: boolean;
    /** if set, define the patterns that will be used to find `*.code-workspace` files */
    readonly vsCodeWsPathMatchers?: RegExp[];
  },
) {
  if (
    repo.wsContext.handled.find((r) => r.repoFsHomeAbs == repo.repoFsHomeAbs)
  ) {
    // deno-fmt-ignore
    if (repo.wsContext.debug) console.debug(c.dim(`[ensureRepo] already preparing ${c.underline(repo.repoUrlWithoutScheme)} ${JSON.stringify(options)}, popping stack`));
    return;
  }
  repo.wsContext.handled.push(repo);

  // deno-fmt-ignore
  if (repo.wsContext.debug) console.debug(c.dim(`[ensureRepo] preparing ${c.underline(repo.repoUrlWithoutScheme)} ${JSON.stringify(options)}`));
  if (repo.stat?.isDirectory) {
    if (options?.force) {
      // deno-fmt-ignore
      console.info(`${c.yellow(repo.repoUrlWithoutScheme)} found, forcing re-create by removing ${c.red(repo.repoFsHomeRel)}`);
      await Deno.remove(repo.repoFsHomeAbs, { recursive: true });
    } else {
      // deno-fmt-ignore
      console.info(`${c.yellow(repo.repoUrlWithoutScheme)} found, pulling latest in ${c.green(repo.repoFsHomeRel)}`);
      await $`git -C ${repo.repoFsHomeAbs} pull --quiet`;
      if (!options?.skipMgitVsCodeWsAutoDetect) {
        await symlinkMgitVsCodeWs(repo, options);
      }
      if (options?.ensureVscWsDepsFolders) {
        await ensureRepos(repo, options);
      }
      return true;
    }
  }

  await Deno.mkdir(repo.pp.dir, { recursive: true });
  try {
    await $`git clone ${repo.repoURL} ${repo.repoFsHomeAbs} --quiet`;
    // deno-fmt-ignore
    console.log(`${c.yellow(repo.repoUrlWithoutScheme)} not found, cloned ${c.magenta(repo.repoFsHomeRel)}`);
    if (!options?.skipMgitVsCodeWsAutoDetect) {
      await symlinkMgitVsCodeWs(repo, options);
    }
    if (options?.ensureVscWsDepsFolders) {
      await ensureRepos(repo, options);
    }
    return true;
  } catch (error) {
    // deno-fmt-ignore
    console.error(`${c.yellow(repo.repoURL.toString())}${c.red(' is not a valid managed Git URL')}`);
    console.log(c.dim(error));
    return false;
  }
}

export async function symlinkMgitVsCodeWs(
  repo: WorkspaceRepo,
  options?: { readonly vsCodeWsPathMatchers?: RegExp[] },
) {
  for await (
    const we of walk(repo.repoFsHomeAbs, {
      match: options?.vsCodeWsPathMatchers ||
        repo.wsContext.vsCodeWsPathMatchers,
    })
  ) {
    const relMgitWsPathInRepo = path.relative(
      repo.wsContext.workspaceFsHome,
      we.path,
    );
    const mgitWsSymlinkPath = path.join(
      repo.wsContext.workspaceFsHome,
      we.name,
    );
    // deno-fmt-ignore
    console.log(`  ${c.dim("symlink'd")} ${c.magenta(we.name)} ➡️ ${c.green(relMgitWsPathInRepo)}`);
    try {
      await Deno.remove(mgitWsSymlinkPath);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        // it's OK if the symlink didn't already exist
      } else {
        // otherwise re-throw
        throw error;
      }
    }
    await Deno.symlink(relMgitWsPathInRepo, mgitWsSymlinkPath);
  }
}

export function isValidVscWorkspaceDepsSupplier(
  vscWorkspaceCandidate: unknown,
): vscWorkspaceCandidate is {
  readonly folders: { readonly path: string; readonly name?: string }[];
} {
  const isValidFolder = (
    folderCandidate: unknown,
  ): folderCandidate is { readonly path: string; readonly name?: string } => {
    if (folderCandidate && typeof folderCandidate === "object") {
      const folder: { name?: string; path?: string } = folderCandidate;
      if (folder.path && typeof folder.path === "string") {
        return true;
      }
    }
    return false;
  };

  if (vscWorkspaceCandidate && typeof vscWorkspaceCandidate === "object") {
    const vscWorkspace: { readonly folders?: unknown[] } =
      vscWorkspaceCandidate;
    if (vscWorkspace.folders && Array.isArray(vscWorkspace.folders)) {
      for (const folder of vscWorkspace.folders) {
        if (!isValidFolder(folder)) return false;
      }
      return true;
    }
  }
  return false;
}

export async function ensureVsCodeWsDepRepos(
  vscWorkspaceFsPath: string,
  wsContext = workspaceContext(),
  options?: {
    readonly force?: boolean;
    readonly skipMgitVsCodeWsAutoDetect?: boolean;
    readonly ensureVscWsDepsFolders?: boolean;
  },
) {
  // deno-fmt-ignore
  if (wsContext.debug) console.debug(c.dim(`[ensureVsCodeWsDepRepos] preparing ${c.underline(vscWorkspaceFsPath)} ${JSON.stringify(options)}`));
  try {
    const vscWorkspace = JSONC.parse(
      await Deno.readTextFile(vscWorkspaceFsPath),
    );
    if (isValidVscWorkspaceDepsSupplier(vscWorkspace)) {
      // deno-fmt-ignore
      if (wsContext.debug) console.log(`${c.dim('Determining dependent repos in')} ${c.dim(c.underline(vscWorkspaceFsPath))}`)
      for await (const folder of vscWorkspace.folders) {
        // deno-fmt-ignore
        if (wsContext.debug) console.log(`${c.dim('  found dependent repo ')} ${c.dim(c.underline(folder.path))}`)
        await ensureRepo(
          await workspaceRepo(folder.path, wsContext),
          options,
        );
      }
    } else {
      // deno-fmt-ignore
      console.log(`${c.dim('  no `folders` found in ')} ${c.dim(c.underline(vscWorkspaceFsPath))}`)
    }
  } catch (error) {
    // deno-fmt-ignore
    console.error(`${c.red('Error determining dependent repos in')} ${c.yellow(vscWorkspaceFsPath)}:`)
    console.error(c.dim(error.toString()));
  }
}

export async function ensureRepos(
  repo: WorkspaceRepo,
  options?: {
    readonly vsCodeWsPathMatchers?: RegExp[];
    readonly force?: boolean;
    readonly skipMgitVsCodeWsAutoDetect?: boolean;
    readonly skipMgitVsCodeWsDepReposEnsure?: boolean;
  },
) {
  // deno-fmt-ignore
  if (repo.wsContext.debug) console.debug(c.dim(`[ensureRepos] preparing ${c.underline(repo.repoUrlWithoutScheme)} ${JSON.stringify(options)}`));
  for await (
    const we of walk(repo.repoFsHomeAbs, {
      match: options?.vsCodeWsPathMatchers ||
        repo.wsContext.vsCodeWsPathMatchers,
    })
  ) {
    const relMgitWsPathInRepo = path.relative(
      repo.wsContext.workspaceFsHome,
      we.path,
    );
    await ensureVsCodeWsDepRepos(
      relMgitWsPathInRepo,
      repo.wsContext,
      options,
    );
  }
}

export async function inspect(
  wsContext: WorkspaceContext,
  options?: {
    readonly vsCodeWsPathMatchers?: RegExp[];
  },
) {
  const allRepos = new Set<string>();
  const gitManagers = new Set<string>();
  for await (
    const we of walk(wsContext.workspaceFsHome, {
      match: options?.vsCodeWsPathMatchers ||
        wsContext.vsCodeWsPathMatchers,
    })
  ) {
    const relMgitWsPathInRepo = path.relative(
      wsContext.workspaceFsHome,
      we.path,
    );
    try {
      const vscWorkspace = JSONC.parse(
        await Deno.readTextFile(relMgitWsPathInRepo),
      );
      if (isValidVscWorkspaceDepsSupplier(vscWorkspace)) {
        for (const folder of vscWorkspace.folders) {
          const repoPath = folder.path == "."
            ? path.dirname(path.relative(wsContext.workspaceFsHome, we.path))
            : folder.path;
          allRepos.add(repoPath);
          const pathItems = repoPath.split(path.SEP);
          if (pathItems.length > 0) {
            gitManagers.add(pathItems[0]);
          }
        }
      }
    } catch (error) {
      // deno-fmt-ignore
      console.error(`${c.red('Error determining dependent repos in')} ${c.yellow(relMgitWsPathInRepo)}:`)
      console.error(c.dim(error.toString()));
    }
  }
  console.log(
    `${c.dim("Git Managers")} ${
      Array.from(gitManagers.values()).sort().join(", ")
    }`,
  );
  console.log(
    `${c.dim("All mGit repos from *.code-workspace folder entries:")}\n  - ${
      Array.from(allRepos.values()).sort().join("\n  - ")
    }`,
  );
  // TODO:
  // # List file counts for all folders in a VS Code *.code-workspace file
  // cat $vscws | jq -r '.folders[] | "FC=`find \(.path)/* -type f | wc -l`; echo \"$FC\t\(.path)\""' | sh

  // # List path sizes for all folders in a VS Code *.code-workspace file
  // cat $vscws | jq -r '.folders[] | "du -s \(.path)"' | sh
}
