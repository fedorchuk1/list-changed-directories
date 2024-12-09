import * as exec from "@actions/exec";
import * as core from "@actions/core";

export async function gitLsFiles(path: string) {
  let stdout = "";
  await exec.exec("git", ["ls-files", "-z", "--", path], {
    listeners: {
      stdout: (data) => (stdout += data.toString()),
    },
  });
  console.log();
  return stdout.split("\0").filter((file) => file.length > 0);
}

export async function gitFetch(sha: string) {
  if (!sha) {
    throw new Error('SHA is required for git fetch');
  }

  core.debug(`Attempting to fetch SHA: ${sha}`);
  
  try {
    // First ensure we have enough history
    core.debug('Fetching complete history...');
    await exec.exec("git", ["fetch", "--unshallow", "origin"]);
  } catch (error) {
    core.debug('Repository might already be complete or --unshallow failed, continuing...');
  }

  try {
    // Try to verify if we already have the commit
    core.debug(`Verifying commit: ${sha}`);
    await exec.exec("git", ["cat-file", "-e", `${sha}^{commit}`]);
    core.debug('Commit verification successful');
  } catch (error) {
    // If we don't have the commit, try to fetch it
    core.debug(`Commit not found locally, attempting to fetch specific SHA: ${sha}`);
    try {
      await exec.exec("git", ["fetch", "origin", sha]);
    } catch (fetchError) {
      core.warning(`Could not fetch ${sha}, attempting to use parent commit`);
      // Try to use the parent of the current commit
      const currentSha = process.env.GITHUB_SHA;
      if (!currentSha) {
        throw new Error('GITHUB_SHA environment variable is not set');
      }
      core.debug(`Using current SHA: ${currentSha}`);
      await exec.exec("git", ["fetch", "origin", currentSha]);
    }
  }
}

export async function gitDiffExists(
  commit: string,
  paths: string[],
  quiet: boolean = false,
) {
  if (!commit || !paths.length) {
    throw new Error('Commit and paths are required for git diff');
  }

  const stdoutOption = quiet ? "--quiet" : "--name-only";
  const exitCode = await exec.exec(
    "git",
    ["diff", "--exit-code", stdoutOption, commit, "--", ...paths],
    { ignoreReturnCode: true },
  );
  return exitCode !== 0;
}