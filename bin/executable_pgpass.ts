#!/usr/bin/env -S deno run -A

import * as path from "https://deno.land/std@0.173.0/path/mod.ts";
import docopt from "https://deno.land/x/docopt@v1.0.7/mod.ts";
import JSON5 from "npm:json5";
import { z } from "https://deno.land/x/zod@v3.20.2/mod.ts";

const cmd = path.basename(import.meta.url);
const pgPassFile = path.join(`${Deno.env.get("HOME")}`, ".pgpass");
const doc = `
Netspective Labs Home (NLH) conventional .pgpass inspection.

Usage:
  ${cmd} inspect [--src=<file>] [--mask-password]
  ${cmd} env [--src=<file>] [--no-export] [--prefix=<text>] [--conn-id=<matcher>...] [--warn-no-descriptors]
  ${cmd} prepare <format> --conn-id=<matcher>... [--all] [--src=<file>]
  ${cmd} (psql-fmt|psql|pgcenter) --conn-id=<matcher>... [--all] [--src=<file>]
  ${cmd} url --conn-id=<matcher>... [--all] [--src=<file>]
  ${cmd} -h | --help
  ${cmd} --version

Options:
  -h --help              Show this screen.
  --src=<file>           The source of .pgpass content [default: ${pgPassFile}] 
  --no-export            Don't add 'export' clause to emitted env var lines
  --prefix=<text>        Env var prefix [default: PG_]
  --conn-id=<matcher>    Connection ID matching regular expression(s)
  --all                  Produce all matching connections, not just the first one
  --warn-no-descriptors  Provide warning for which connections do not provide descriptors
  --version              Show version.

Help:  
  To generate an arbitrary string for a connection ID:

    pgpass.ts prepare '\`\${conn.database}\`' --conn-id="GITLAB"

    Be sure to use '\`...\`' where ... is a JS string literal type that can use:
      \${conn.host} \${String(conn.port)} \${conn.database} \${conn.username} \${conn.password}

  To generate \`psql\`-friendly parameters for a given connection:

    pgpass.ts psql-fmt --conn-id="GITLAB"

    You can use is like this:
    
      psql \`pgpass.ts psql-fmt --conn-id="GITLAB"\`
      pgcenter top \`pgpass.ts psql-fmt --conn-id="GITLAB"\`

  To generate psql or pgcenter commands that you can use as-is:

    pgpass.ts psql --conn-id="GITLAB"
    pgpass.ts pgcenter --conn-id="GITLAB"

  To generate env vars for all pgpass connections using default prefix:

    pgpass.ts env

  To generate env vars for all pgpass connections using custom prefix:

    pgpass.ts env --prefix=MYP_ 

  To generate env vars for specific pgpass connections using custom prefix:

    pgpass.ts env --prefix=MYP_ --conn-id="GITHUB" --conn-id="GITLAB"

  NOTE: --conn-id is passed into \`new RegExp(connId)\` so you can use any parseable regex.
`;

export const connectionDescriptorSchema = z.object({
  id: z.string(),
  description: z.optional(z.string()),
  boundary: z.optional(z.string()),
  srcLineNumber: z.number(),
});
export type ConnectionDescriptor = z.infer<typeof connectionDescriptorSchema>;

export const connectionSchema = z.object({
  connDescr: z.object(connectionDescriptorSchema.shape),
  host: z.string(),
  port: z.string().transform<number>((text) => parseInt(text)),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  srcLineNumber: z.number(),
});
export type Connection = z.infer<typeof connectionSchema>;

export async function parse(
  src: string,
  options?: { maskPassword?: (passwd: string) => string },
) {
  const conns: Connection[] = [];
  const warnings: { message: string; srcLineNumber: number }[] = [];
  const pgpass = await Deno.readTextFile(src);
  let activeConnDescr: ConnectionDescriptor | undefined;
  let srcLineNumber = 0;
  for (const line of pgpass.split(/\n/)) {
    srcLineNumber++;
    // process comments
    if (line.match(/^#/)) {
      // NLH .pgpass convention assumes that before each connection is defined we
      // should should include a strict JSONL definition that includes a line like
      // { id: "XYZ", description: "Purpose", boundary: "Network" }
      if (line.match(/^#\s+\{.*\}\s*$/)) {
        const jsonl = line.slice(1);
        try {
          // remove the starting #, convert to POJO, then let Zod validate it
          activeConnDescr = connectionDescriptorSchema.parse({
            // deno-lint-ignore ban-types
            ...(JSON5.parse(jsonl) as object),
            srcLineNumber,
          });
        } catch (error) {
          console.error("Unable to parse conn descriptor: ", jsonl);
          console.error(error);
        }
      }
    } else if (line.trim().length == 0) {
      // skip blank lines
    } else {
      if (!activeConnDescr) {
        warnings.push({
          message: "conn has no descriptor preceding it.",
          srcLineNumber,
        });
        continue;
      }

      // anything that's not a comment is a line like this:
      // # hostname:port:database:username:password
      // e.g. 192.168.2.x:5432:database:postgres:sup3rSecure!
      try {
        let [host, port, database, username, password] = line.split(":");
        if (options?.maskPassword) password = options.maskPassword(password);
        const potentialConn = {
          connDescr: activeConnDescr,
          host,
          port,
          database,
          username,
          password,
          srcLineNumber,
        };
        conns.push(connectionSchema.parse(potentialConn));
        activeConnDescr = undefined; // reset it since we've used it
      } catch (error) {
        console.error("Unable to parse conn: ", line);
        console.error(error);
      }
    }
  }
  return { conns, warnings };
}

if (import.meta.main) {
  interface Arguments {
    readonly "--src": string;

    readonly env?: boolean;
    readonly "--no-export"?: boolean;
    readonly "--prefix"?: string;
    readonly "--conn-id"?: string[];
    "--warn-no-descriptors"?: boolean;
    connMatchers?: RegExp[];

    readonly inspect?: boolean;
    readonly "--mask-password"?: boolean;

    readonly prepare?: boolean;
    readonly "<format>"?: string;
    prepareFormat?: (conn: Connection) => string;

    readonly psql?: boolean;
    readonly "psql-fmt"?: boolean;
    readonly pgcenter?: boolean;
    readonly url?: boolean;

    readonly "--all": boolean;

    readonly "--version"?: boolean;
    readonly "--help"?: boolean;
  }

  let args: Arguments;
  try {
    args = docopt(doc) as unknown as Arguments;
    if (args.inspect) args["--warn-no-descriptors"] = true;
    args.connMatchers = args["--conn-id"]
      ? (args["--conn-id"].map((re) => new RegExp(re)))
      : undefined;
    if (args["psql-fmt"] || args.psql || args.pgcenter) {
      args.prepareFormat = (conn: Connection) =>
        // deno-fmt-ignore
        `${args["psql-fmt"] ? '' : args.psql ? 'psql' : 'pgcenter top'} -h ${conn.host} -p ${conn.port} -d ${conn.database} -U ${conn.username}`;
    }
    if (args.url) {
      args.prepareFormat = (conn: Connection) =>
        // deno-fmt-ignore
        `postgres://${conn.username}:${conn.password}@${conn.host}:${conn.port}/${conn.database}`;
    }
    if (args.prepare && args["<format>"]) {
      // deno-lint-ignore no-unused-vars
      args.prepareFormat = (conn: Connection) => {
        return eval(args["<format>"]!);
      };
    }
  } catch (e) {
    console.error(e.message);
    Deno.exit(1);
  }

  if (args["--version"]) {
    console.log(`pgpass.ts version 1.0`);
    Deno.exit(0);
  }

  if (args["--help"]) {
    console.log(doc);
    Deno.exit(0);
  }

  const { conns, warnings } = await parse(args["--src"], {
    maskPassword: args["--mask-password"]
      ? ((text) => "*".repeat(text.length))
      : undefined,
  });

  if (args.inspect) {
    console.dir({ args, conns, warnings });
  } else if (args.env) {
    const prefix = args["--prefix"] ?? "PG_";
    const exp = args["--no-export"] ? "" : "export ";
    const prepare = (conn: Connection, varName: string, value: string) =>
      // deno-fmt-ignore
      `${exp}${`${prefix}${conn.connDescr.id}_${varName}`.toLocaleUpperCase()}="${value}"`;
    CONNS:
    for (const conn of conns) {
      if (args.connMatchers) {
        let matched = 0;
        for (const matcher of args.connMatchers) {
          if (conn.connDescr.id.match(matcher)) matched++;
        }
        if (matched == 0) continue CONNS;
      }
      console.log(prepare(conn, "HOST", conn.host));
      console.log(prepare(conn, "PORT", String(conn.port)));
      console.log(prepare(conn, "DATABASE", conn.database));
      console.log(prepare(conn, "USER", conn.username));
      console.log(prepare(conn, "PASSWORD", conn.password));
    }
  } else {
    if (args.prepareFormat && args.connMatchers) {
      CONN:
      for (const conn of conns) {
        for (const matcher of args.connMatchers) {
          if (conn.connDescr.id.match(matcher)) {
            console.log(args.prepareFormat(conn));
            if (!args["--all"]) break CONN;
          }
        }
      }
    } else {
      // if we get to here it means that arguments weren't handled properly
      console.error("[ERROR] Unable to determine course of action.");
      console.dir(args);
    }
  }
}
