import { editSketch } from "./lib/edit-sketch-op";
import { readMeta } from "./lib/meta-io";
import { SKETCH_TYPES, type SketchType } from "./lib/meta";

const USAGE =
  "Usage: npm run edit-sketch -- --id <id> [--name <name>] [--new-id <new-id>] [--type <type>]";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv: string[]) {
  const args = [...argv];
  let id: string | undefined;
  let name: string | undefined;
  let newId: string | undefined;
  let type: SketchType | undefined;

  while (args.length) {
    const arg = args.shift()!;
    if (arg === "--id") {
      id = args.shift();
    } else if (arg === "--name") {
      name = args.shift();
    } else if (arg === "--new-id") {
      newId = args.shift();
    } else if (arg === "--type") {
      const val = args.shift();
      if (!val || !(SKETCH_TYPES as readonly string[]).includes(val))
        fail(`--type must be one of: ${SKETCH_TYPES.join(", ")}`);
      type = val as SketchType;
    }
  }

  return { id, name, newId, type };
}

function main(): void {
  const { id, name, newId, type } = parseArgs(process.argv.slice(2));

  if (!id) fail(USAGE);

  const current = readMeta(id);

  editSketch({
    id,
    name: name ?? current.name,
    newId,
    type: type ?? current.type,
  });

  const finalId = newId ?? id;
  console.log(`Edited sketch "${id}"${newId ? ` → "${finalId}"` : ""}`);
  if (name) console.log(`  name: ${name}`);
  if (type) console.log(`  type: ${type}`);
  if (newId) console.log(`  new id: ${newId}`);
}

main();
