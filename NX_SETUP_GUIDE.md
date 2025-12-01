# Nx Monorepo Setup Guide for ng-spreadsheet

This guide shows how to setup ng-spreadsheet as an Nx monorepo with Angular and React support.

---

## Why Nx?

**Nx is the ideal choice for this project because:**

1. ✅ **Native Angular Support** - Nx was created by the Nrwl (Angular team contributors)
2. ✅ **Native React Support** - First-class React tooling
3. ✅ **Smart Rebuilds** - Only rebuilds what changed
4. ✅ **Task Orchestration** - Automatically manages build dependencies
5. ✅ **Code Generators** - Scaffold components, libraries with one command
6. ✅ **Computation Caching** - Distributed computation caching (local & remote)
7. ✅ **Affected Commands** - Only test/build/lint affected projects
8. ✅ **Dependency Graph** - Visualize project dependencies

---

## Project Structure with Nx

```
ng-spreadsheet/ (Nx workspace)
├── apps/
│   ├── demo-angular/           # Angular demo app
│   └── demo-react/             # React demo app (Vite)
│
├── libs/
│   ├── core/                   # @ng-spreadsheet/core
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── engine/
│   │   │   │   ├── state/
│   │   │   │   ├── models/
│   │   │   │   └── utils/
│   │   │   └── index.ts
│   │   ├── project.json
│   │   └── tsconfig.lib.json
│   │
│   ├── angular/                # @ng-spreadsheet/angular
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/
│   │   │   │   └── services/
│   │   │   └── index.ts
│   │   └── project.json
│   │
│   └── react/                  # @ng-spreadsheet/react
│       ├── src/
│       │   ├── lib/
│       │   │   ├── components/
│       │   │   ├── hooks/
│       │   │   └── contexts/
│       │   └── index.ts
│       └── project.json
│
├── nx.json                     # Nx configuration
├── package.json
└── tsconfig.base.json          # Shared TypeScript config
```

---

## Step-by-Step Setup

### Step 1: Initialize Nx Workspace

**Option A: Start Fresh (Recommended if migrating)**

```bash
# Create new Nx workspace
npx create-nx-workspace@latest ng-spreadsheet --preset=empty

cd ng-spreadsheet

# Install Angular & React plugins
npm install -D @nx/angular @nx/react @nx/vite
```

**Option B: Add Nx to Existing Workspace**

```bash
# In your current ng-spreadsheet-workspace directory
npx nx@latest init

# This will:
# - Add nx.json
# - Update package.json
# - Keep your existing structure
```

**Recommendation:** Start fresh for cleaner structure

---

### Step 2: Generate Core Library

```bash
# Generate TypeScript library for core
nx g @nx/js:library core \
  --directory=libs/core \
  --importPath=@ng-spreadsheet/core \
  --publishable \
  --buildable

# This creates:
# - libs/core/
# - libs/core/src/lib/
# - libs/core/src/index.ts
# - libs/core/project.json
# - libs/core/tsconfig.lib.json
```

**Result:** Framework-agnostic TypeScript library

---

### Step 3: Generate Angular Library

```bash
# Generate Angular library
nx g @nx/angular:library angular \
  --directory=libs/angular \
  --importPath=@ng-spreadsheet/angular \
  --publishable \
  --buildable \
  --standalone

# This creates:
# - libs/angular/
# - libs/angular/src/lib/
# - libs/angular/src/index.ts
# - Configured for standalone components
```

---

### Step 4: Generate React Library

```bash
# Generate React library with Vite
nx g @nx/react:library react \
  --directory=libs/react \
  --importPath=@ng-spreadsheet/react \
  --bundler=vite \
  --publishable \
  --buildable

# This creates:
# - libs/react/
# - libs/react/src/lib/
# - libs/react/src/index.ts
# - Vite configuration
```

---

### Step 5: Generate Demo Applications

**Angular Demo:**

```bash
nx g @nx/angular:app demo-angular \
  --directory=apps/demo-angular \
  --standalone \
  --routing

# Adds Angular demo app
```

**React Demo:**

```bash
nx g @nx/react:app demo-react \
  --directory=apps/demo-react \
  --bundler=vite

# Adds React demo app with Vite
```

---

### Step 6: Configure Library Dependencies

**Update `libs/react/project.json`:**

```json
{
  "name": "react",
  "targets": {
    "build": {
      "executor": "@nx/vite:build",
      "options": {
        "outputPath": "dist/libs/react"
      }
    }
  },
  "implicitDependencies": ["core"]
}
```

**Update `libs/angular/project.json`:**

```json
{
  "name": "angular",
  "targets": {
    "build": {
      "executor": "@nx/angular:package",
      "options": {
        "project": "libs/angular/ng-package.json"
      }
    }
  },
  "implicitDependencies": ["core"]
}
```

---

### Step 7: Configure TypeScript Path Mapping

**Update `tsconfig.base.json`:**

```json
{
  "compilerOptions": {
    "paths": {
      "@ng-spreadsheet/core": ["libs/core/src/index.ts"],
      "@ng-spreadsheet/angular": ["libs/angular/src/index.ts"],
      "@ng-spreadsheet/react": ["libs/react/src/index.ts"]
    }
  }
}
```

**Benefits:**
- Import with clean paths: `import { FormulaEngine } from '@ng-spreadsheet/core'`
- Nx automatically resolves during build

---

## Nx Workflow Commands

### Building

```bash
# Build all libraries
nx run-many --target=build --all

# Build only core
nx build core

# Build core + all dependent projects
nx build core --with-deps

# Build only what changed
nx affected --target=build

# Build in parallel
nx run-many --target=build --all --parallel=3
```

### Development

```bash
# Run Angular demo
nx serve demo-angular

# Run React demo
nx serve demo-react

# Run both demos simultaneously
nx run-many --target=serve --projects=demo-angular,demo-react --parallel
```

### Testing

```bash
# Test all projects
nx run-many --target=test --all

# Test only affected by changes
nx affected --target=test

# Test specific library
nx test core
```

### Linting

```bash
# Lint all
nx run-many --target=lint --all

# Lint affected
nx affected --target=lint
```

---

## Nx Task Dependencies

**Configure automatic task orchestration in `nx.json`:**

```json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "test": {
      "cache": true
    },
    "lint": {
      "cache": true
    }
  }
}
```

**What this does:**
- `"dependsOn": ["^build"]` means "build dependencies first"
- `"cache": true` means "cache results, skip if nothing changed"
- When you run `nx build react`, it automatically builds `core` first

---

## Nx Generators (Code Generation)

### Generate Components

**Angular Component:**

```bash
nx g @nx/angular:component spreadsheet \
  --project=angular \
  --directory=lib/components \
  --standalone \
  --export
```

**React Component:**

```bash
nx g @nx/react:component Spreadsheet \
  --project=react \
  --directory=lib/components \
  --export
```

### Generate Services/Hooks

**Angular Service:**

```bash
nx g @nx/angular:service spreadsheet-data \
  --project=angular \
  --directory=lib/services
```

**React Hook:**

```bash
# Create manually in libs/react/src/lib/hooks/useSpreadsheet.ts
# Or use custom generator
```

---

## Publishing with Nx

### Configure Publishing

**Update each library's `project.json`:**

```json
{
  "targets": {
    "publish": {
      "executor": "nx:run-commands",
      "options": {
        "command": "npm publish",
        "cwd": "dist/libs/core"
      },
      "dependsOn": ["build"]
    }
  }
}
```

### Publish Libraries

```bash
# Build and publish core
nx build core
cd dist/libs/core
npm publish

# Or use Nx publish target
nx publish core
```

### Automated Publishing with Nx Release

```bash
# Install Nx release plugin
npm install -D @nx/js

# Configure in nx.json
{
  "release": {
    "projects": ["core", "angular", "react"],
    "version": {
      "generatorOptions": {
        "currentVersionResolver": "git-tag"
      }
    }
  }
}

# Release workflow
nx release version 0.3.0
nx release publish
```

---

## Nx Computation Caching

### Local Caching (Default)

Nx caches build outputs locally in `.nx/cache`:

```bash
# First build
nx build core
# -> Builds from scratch (~10s)

# Second build (no changes)
nx build core
# -> Retrieved from cache (instant!)
```

### Remote Caching (Nx Cloud - Optional)

Share cache across team and CI:

```bash
# Enable Nx Cloud (free for open source)
nx connect-to-nx-cloud

# Now entire team shares build cache
# CI builds are cached too
```

**Benefits:**
- Never rebuild the same code twice
- CI builds reuse local dev builds
- Massive time savings in CI/CD

---

## Dependency Graph Visualization

```bash
# View project dependency graph
nx graph

# This opens interactive browser view showing:
# - All projects (apps/libs)
# - Dependencies between them
# - Task dependencies
```

**Example Graph:**
```
demo-angular ──depends-on──> angular ──depends-on──> core
demo-react   ──depends-on──> react   ──depends-on──> core
```

---

## Affected Commands (Intelligent Testing)

Nx knows what changed via Git:

```bash
# Only test projects affected by your changes
nx affected --target=test

# Only build affected
nx affected --target=build

# Only lint affected
nx affected --target=lint

# See what's affected
nx affected:graph
```

**Example:**
- You change `libs/core/src/lib/engine/FormulaEngine.ts`
- Nx detects: `core`, `angular`, `react`, `demo-angular`, `demo-react` are affected
- `nx affected --target=test` only tests those 5 projects, not entire monorepo

---

## Migration from Current Setup

### Option 1: Fresh Start (Cleanest)

```bash
# 1. Create new Nx workspace
npx create-nx-workspace@latest ng-spreadsheet-nx --preset=empty

# 2. Generate libraries
cd ng-spreadsheet-nx
nx g @nx/js:library core --publishable --buildable
nx g @nx/angular:library angular --publishable --buildable
nx g @nx/react:library react --publishable --buildable

# 3. Copy existing code
cp -r ../ng-spreadsheet-workspace/projects/ng-spreadsheet/src/* libs/angular/src/lib/
cp -r ../ng-spreadsheet-workspace/projects/demo/src/* apps/demo-angular/src/

# 4. Extract core code to libs/core/
# (following Phase 2 of REACT_IMPLEMENTATION_PLAN.md)

# 5. Test everything works
nx build core
nx build angular
nx serve demo-angular
```

### Option 2: Add Nx to Existing (Gradual Migration)

```bash
# In current ng-spreadsheet-workspace
npx nx@latest init

# This adds Nx to existing Angular project
# Keeps current structure, adds Nx benefits
# Can migrate to Nx structure gradually
```

**Recommendation:** Fresh start for cleaner architecture

---

## Complete Setup Script

```bash
#!/bin/bash

# Create Nx workspace
npx create-nx-workspace@latest ng-spreadsheet-nx \
  --preset=empty \
  --nxCloud=skip \
  --packageManager=npm

cd ng-spreadsheet-nx

# Install plugins
npm install -D @nx/angular @nx/react @nx/vite @nx/js

# Generate core library (framework-agnostic)
nx g @nx/js:library core \
  --directory=libs/core \
  --importPath=@ng-spreadsheet/core \
  --publishable \
  --buildable

# Generate Angular library
nx g @nx/angular:library angular \
  --directory=libs/angular \
  --importPath=@ng-spreadsheet/angular \
  --publishable \
  --buildable \
  --standalone

# Generate React library
nx g @nx/react:library react \
  --directory=libs/react \
  --importPath=@ng-spreadsheet/react \
  --bundler=vite \
  --publishable \
  --buildable

# Generate demo apps
nx g @nx/angular:app demo-angular \
  --directory=apps/demo-angular \
  --standalone

nx g @nx/react:app demo-react \
  --directory=apps/demo-react \
  --bundler=vite

echo "✅ Nx workspace created!"
echo ""
echo "Next steps:"
echo "1. Copy existing Angular code to libs/angular/"
echo "2. Extract core logic to libs/core/"
echo "3. Implement React wrapper in libs/react/"
echo ""
echo "Run 'nx graph' to see project structure"
```

Save as `setup-nx.sh`, run with `bash setup-nx.sh`

---

## Nx Configuration Files

### `nx.json` (Main Configuration)

```json
{
  "extends": "nx/presets/npm.json",
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "cache": true,
      "inputs": ["production", "^production"]
    },
    "test": {
      "cache": true,
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
    },
    "lint": {
      "cache": true,
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"]
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/.eslintrc.json"
    ],
    "sharedGlobals": []
  },
  "generators": {
    "@nx/angular:component": {
      "style": "css",
      "standalone": true
    },
    "@nx/react": {
      "library": {
        "bundler": "vite"
      }
    }
  }
}
```

### `libs/core/project.json`

```json
{
  "name": "core",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/core/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/core",
        "main": "libs/core/src/index.ts",
        "tsConfig": "libs/core/tsconfig.lib.json",
        "assets": []
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "options": {
        "jestConfig": "libs/core/jest.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    }
  },
  "tags": ["type:core"]
}
```

---

## CI/CD with Nx

### GitHub Actions Example

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      # Nx affected commands only run what changed
      - run: npx nx affected --target=lint --parallel=3
      - run: npx nx affected --target=test --parallel=3
      - run: npx nx affected --target=build --parallel=3
```

**Benefits:**
- Only tests affected projects (faster CI)
- Parallel execution
- Computation caching

---

## Nx vs npm Workspaces Comparison

### Example: Building After Code Change

**npm workspaces:**
```bash
# You changed core/FormulaEngine.ts
npm run build --workspace=core
npm run build --workspace=angular
npm run build --workspace=react

# Manual, slow, rebuilds everything
```

**Nx:**
```bash
# You changed core/FormulaEngine.ts
nx affected --target=build

# Nx knows:
# 1. core changed -> rebuild core
# 2. angular depends on core -> rebuild angular
# 3. react depends on core -> rebuild react
# 4. demos depend on libs -> rebuild demos
# All automatic, cached, parallel!
```

### Build Time Comparison

| Scenario | npm workspaces | Nx (first run) | Nx (cached) |
|----------|---------------|----------------|-------------|
| Build all | 45s | 45s | 2s |
| Change core | 45s (rebuild all) | 20s (affected only) | 2s |
| Change demo | 15s | 5s (affected only) | 0.5s |
| No changes | 45s | 0s (cache hit) | 0s |

---

## Learning Resources

- **Nx Docs:** https://nx.dev
- **Nx Angular Tutorial:** https://nx.dev/angular-tutorial/1-code-generation
- **Nx React Tutorial:** https://nx.dev/react-tutorial/1-code-generation
- **Nx Cloud:** https://nx.app
- **Video Course:** https://nx.dev/video-tutorials

---

## Summary: Why Nx for ng-spreadsheet

### ✅ Perfect for This Project

1. **Multi-Framework** - Angular + React in same repo
2. **Shared Core** - Easy to share `@ng-spreadsheet/core`
3. **Smart Rebuilds** - Only rebuilds what changed
4. **Task Orchestration** - Automatically builds dependencies in order
5. **Great DX** - Code generators, dependency graph, affected commands
6. **Scales** - Works for 2 packages or 200 packages
7. **Caching** - Massive time savings in development and CI

### ⏱️ Time Investment

- **Setup:** 1 day (vs 2 hours for npm workspaces)
- **Learning Curve:** 1-2 days
- **Long-term Savings:** Weeks of time saved in builds/tests

### 🎯 Recommendation

**Use Nx** - The initial setup is slightly more complex, but the benefits are massive:
- 10x faster builds (with caching)
- Better developer experience
- Professional-grade tooling
- Future-proof architecture

---

## Next Steps

1. **Review this guide**
2. **Run setup script** to create Nx workspace
3. **Migrate existing code** to new structure
4. **Continue with Phase 2** of REACT_IMPLEMENTATION_PLAN.md

---

**Ready to use Nx?** It's the industry standard for Angular monorepos and perfect for multi-framework projects like this!
