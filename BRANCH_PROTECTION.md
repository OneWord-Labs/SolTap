# SolTap Branch Protection Guide

## Protected Branches Overview

### 1. Main Production Branch (`main`)
Primary branch containing production-ready game code.

**Protection Rules:**
- Requires pull request before merging
- Requires 2 code review approvals
- Dismisses stale pull request approvals
- Requires conversation resolution
- Requires signed commits
- Requires linear history
- No force pushes allowed
- No direct pushes to main
- Branch is locked to maintainers only

### 2. Main Deployment Branch (`soltap-bot-deploy-main`)
Production deployment configuration branch.

**Protection Rules:**
- Requires pull request before merging
- Requires 1 code review approval
- Dismisses stale pull request approvals
- Allows force pushes by maintainers
- Requires conversation resolution
- Branch is locked to maintainers only

### 3. Preview Branch (`sol-deploy-preview`)
Testing and staging deployment branch.

**Protection Rules:**
- Requires pull request before merging
- Requires 1 code review approval
- Allows force pushes for testing
- More flexible for development

## Development Workflows

### 1. Game Feature Development
```bash
# Start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Development work...
git add .
git commit -S -m "feat: your feature description"
git push origin feature/your-feature-name

# Create PR to main through GitHub
# Requires:
# - 2 approvals
# - All conversations resolved
# - Signed commits
# - Linear history
```

### 2. Deployment Changes
```bash
# Start from deployment branch
git checkout soltap-bot-deploy-main
git pull origin soltap-bot-deploy-main

# Create deployment feature branch
git checkout -b deploy/your-change-name

# Make changes...
git add .
git commit -m "deploy: your change description"
git push origin deploy/your-change-name

# Create PR to soltap-bot-deploy-main
# Requires:
# - 1 approval
# - All conversations resolved
```

### 3. Preview Testing
```bash
# Start from preview branch
git checkout sol-deploy-preview
git pull origin sol-deploy-preview

# Create test branch
git checkout -b preview/your-test-name

# Testing changes...
git add .
git commit -m "test: your test description"
git push origin preview/your-test-name

# Create PR to sol-deploy-preview
```

## Emergency Procedures

### 1. Production Hotfix
```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/critical-fix

# Fix the issue
git add .
git commit -S -m "fix: critical issue description"
git push origin hotfix/critical-fix

# Create urgent PR to main
# Still requires protections but prioritize review
```

### 2. Deployment Emergency
```bash
# For maintainers only
git checkout soltap-bot-deploy-main
git pull origin soltap-bot-deploy-main

# Make emergency fix
git add .
git commit -m "fix: emergency deployment fix"
git push --force origin soltap-bot-deploy-main
```

## Branch Naming Conventions

1. Feature Branches:
   - `feature/` - New game features
   - `fix/` - Bug fixes
   - `refactor/` - Code refactoring
   - `docs/` - Documentation updates

2. Deployment Branches:
   - `deploy/` - Deployment changes
   - `config/` - Configuration updates
   - `infra/` - Infrastructure changes

3. Preview Branches:
   - `preview/` - Preview testing
   - `test/` - Test configurations

## Commit Message Guidelines

1. Production Code:
```
feat: add new game mechanic
fix: resolve scoring issue
refactor: improve performance
docs: update game instructions
```

2. Deployment Code:
```
deploy: update fly.io configuration
config: modify environment variables
infra: upgrade node version
```

## Pull Request Process

### 1. For Main Branch
1. Create PR from feature branch to `main`
2. Fill out PR template
3. Request 2 reviewers
4. Address all comments
5. Ensure all checks pass
6. Squash and merge

### 2. For Deployment Branch
1. Create PR from deploy branch to `soltap-bot-deploy-main`
2. Fill out deployment checklist
3. Request 1 reviewer
4. Test in preview environment
5. Merge when approved

## Protection Rule Bypass (Maintainers Only)

### When to Bypass:
1. Critical production issues
2. Time-sensitive deployments
3. Emergency fixes

### How to Bypass:
```bash
# Force push (deployment branch only)
git push --force origin soltap-bot-deploy-main

# Skip CI (emergency only)
git commit -m "fix: critical issue [skip ci]"
```

## Monitoring and Maintenance

### 1. Regular Checks
- Review protection settings monthly
- Audit bypass usage
- Update approved maintainers list

### 2. CI/CD Integration
- Ensure CI checks are required
- Keep test suite updated
- Monitor build times

### 3. Documentation
- Keep this guide updated
- Document protection changes
- Maintain decision log

## Contact and Support

For questions about branch protection or to request maintainer access:
1. Open an issue with label `branch-protection`
2. Contact repository administrators
3. Request review of protection settings 