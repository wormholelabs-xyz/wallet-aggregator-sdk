import fs from "fs";
import path from "path";

function updatePackageJsonVersion(dir, newVersion) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== "node_modules") {
      updatePackageJsonVersion(fullPath, newVersion);
    } else if (file === "package.json") {
      const pkg = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      pkg.version = newVersion;
      fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
      console.log(`Updated version in ${fullPath}`);
    }
  }
}

if (process.argv.length < 3) {
  console.error("Usage: node update-versions.js <new-version>");
  process.exit(1);
}

const newVersion = process.argv[2];
updatePackageJsonVersion("./packages", newVersion);
