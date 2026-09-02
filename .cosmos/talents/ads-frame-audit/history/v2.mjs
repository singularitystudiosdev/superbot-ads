export default async function (args, ctx) {
  const { spawn } = await import("node:child_process");
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const cli = ["tools/audit.mjs"];
  if (args.allRatios) cli.push("--all-ratios");
  else if (args.ratio) cli.push("--ratio", String(args.ratio));
  if (args.fps) cli.push("--fps", String(args.fps));
  const r = await new Promise((resolve, reject) => {
    const child = spawn("node", cli, { cwd: ctx.projectRoot });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
  if (r.stderr) throw new Error(r.stderr);
  let report = {};
  try { report = JSON.parse(await readFile(join(ctx.projectRoot, ".tmp/audit/report.json"), "utf8")); } catch {}
  const violations = report.violations ? report.violations.length : null;
  return {
    summary: `violations=${violations} samples=${report.samples ?? "?"} ratios=${(report.ratios ?? []).join("+")} exit=${r.code}`,
    violations,
    groups: report.groups || [],
    samples: report.samples,
    ratios: report.ratios,
    exitCode: r.code,
    stdout: r.stdout.trim(),
  };
}
