import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function updateVersionInPackageJson(dirPath: string, version: string) {
  const packageJsonPath = path.join(dirPath, "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  packageJson.version = version;

  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n"
  );
  console.log(`Updated version to ${version} in ${packageJsonPath}`);
}

function rootDir(): string {
  return path.join(__dirname, "..");
}

function updateVersionsInWorkspace(version: string) {
  const dir = rootDir();

  // Update root package.json
  updateVersionInPackageJson(dir, version);

  // Read bun workspace configuration from package.json
  const workspaceConfigPath = path.join(dir, "package.json");

  if (!fs.existsSync(workspaceConfigPath)) {
    throw new Error("package.json not found");
  }

  // For this repo, we know the patterns are 'packages/*' and 'packages/wallets/*'
  // Update all packages in packages/react
  const reactDir = path.join(dir, "packages", "react");
  if (fs.existsSync(reactDir)) {
    updateVersionInPackageJson(reactDir, version);
  }

  // Update all packages in packages/wallets/*
  const walletsDir = path.join(dir, "packages", "wallets");
  if (fs.existsSync(walletsDir)) {
    const walletPackages = fs.readdirSync(walletsDir);
    walletPackages.forEach((pkg) => {
      const pkgDir = path.join(walletsDir, pkg);
      if (fs.statSync(pkgDir).isDirectory()) {
        updateVersionInPackageJson(pkgDir, version);
      }
    });
  }
}

const args = process.argv.slice(2);
const version = args[0];

if (!version) {
  console.error("Usage: tsx setVersion.ts <version>");
  console.error("Example: tsx setVersion.ts 1.0.0");
  process.exit(1);
}

updateVersionsInWorkspace(version);
