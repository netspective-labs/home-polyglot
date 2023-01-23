#!/usr/bin/env -S deno run -A
/**
 * Usage:
 *   deno run -A nlh-pre-process.ts
 * 
 * Make it easier to identify chezmoi managed templates/files after they are generated.
 * Walk each file in this directory and:
 * - Check if the file is managed by chezmoi
 * - If the file is managed by chezmoi find text "To modify, use `chezmoi edit ~/nlh-pre-process.ts --apply`."
 * - If the text is found, replace `.*?` with the name of the chezmoi managed target-path of the file.
 * 
 * This script is idempotent -- just run it whenever you modify any files and it won't touch any files that do not need to be updated.
 * If any files are modified the names of the file are emitted to STDOUT; if no files modified, empty result.
 */

import $ from "https://deno.land/x/dax@0.24.1/mod.ts";
import { relative } from "https://deno.land/std@0.173.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.173.0/fs/walk.ts";

const homePath = Deno.env.get("HOME");
if (!homePath) {
    console.error("Unable to determine user's home path");
    Deno.exit(-1);
}

for await (const dirEntry of walk('./')) {
    if (dirEntry.path.startsWith(".git")) continue;
    if (dirEntry.isFile) {
        try {
            const targetPath = await $`chezmoi target-path ${dirEntry.path}`.stderr("piped").text();
            const relTargetPath = relative(homePath, targetPath);
            const content = await Deno.readTextFile(dirEntry.path);
            const replaced = content.replaceAll(/To modify, use \`chezmoi edit .*? --apply\`./ig, `To modify, use \`chezmoi edit \~\/${relTargetPath} \-\-apply\`.`);
            if (content != replaced) {
                await Deno.writeTextFile(dirEntry.path, replaced);
                console.log(dirEntry.path, relative(homePath, targetPath));
            }
        } catch (error) {
            console.log(error)
        }
    }
}
