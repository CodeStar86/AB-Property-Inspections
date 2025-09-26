# Version Lock Documentation
## AB Property Inspection Services - Critical Dependencies

This document tracks all version-pinned dependencies and the reasons for locking them.

### 🔒 Locked Dependencies

#### Core Framework
- **React**: `^18.3.1`
  - Status: Safe to update minor/patch
  - Last Updated: Project Start
  - Notes: Stable API, backward compatible

#### UI Libraries
- **sonner**: `2.0.3` ⚠️ **LOCKED**
  - Reason: Toast notifications work perfectly at this version
  - Import: `import { toast } from 'sonner@2.0.3'`
  - Breaking Changes: v3.0 changed API significantly
  - Next Review: Q2 2024

- **react-hook-form**: `7.55.0` ⚠️ **LOCKED**
  - Reason: Form validation logic depends on this specific API
  - Import: `import { ... } from 'react-hook-form@7.55.0'`
  - Breaking Changes: v8.0 introduces new validation approach
  - Next Review: When v8.0 is stable

#### Styling
- **Tailwind CSS**: `^4.0.0-alpha.25` ⚠️ **ALPHA VERSION**
  - Reason: Using new v4 features in globals.css
  - Status: Monitor for stable release
  - Risk: Alpha versions can have breaking changes
  - Fallback Plan: Prepared v3 configuration

#### Development Tools
- **TypeScript**: `^5.0.2`
  - Status: Safe to update
  - Notes: Excellent backward compatibility

- **Vite**: `^4.4.5`
  - Status: Safe to update minor versions
  - Notes: Build tool, low risk

### 🟢 Safe to Update

These dependencies can be updated regularly:

- `lucide-react` - Icon library
- `class-variance-authority` - Utility library
- `clsx` - Class name utility
- `tailwind-merge` - Tailwind utility
- `@types/*` packages - Type definitions

### 🟡 Update with Caution

These should be tested thoroughly before updating:

- `jspdf` - PDF generation (test invoice PDFs)
- `motion` - Animation library (test all animations)
- `recharts` - Charts (test dashboard charts)
- `react-slick` - Carousel (test any carousels)

### 🔴 High Risk Updates

These require careful planning and testing:

- Major React version changes
- Tailwind CSS stable release
- Form library changes
- Build tool major versions

### Update Process by Risk Level

#### Low Risk (🟢)
1. Update dependency
2. Run build
3. Quick smoke test
4. Deploy

#### Medium Risk (🟡)
```bash
# 1. Create branch
git checkout -b update/package-name

# 2. Update package
npm update package-name

# 3. Full test suite
npm run test
npm run type-check
npm run lint
npm run build

# 4. Manual testing
npm run preview

# 5. If all good, merge
```

#### High Risk (🔴)
```bash
# 1. Create dedicated branch
git checkout -b major-update/package-name

# 2. Research breaking changes
# Read changelog, migration guides

# 3. Update package
npm install package-name@new-version

# 4. Fix breaking changes
# Update code as needed

# 5. Comprehensive testing
npm run test
npm run type-check
npm run lint
npm run build

# 6. Full manual QA
# Test every major feature

# 7. Staging deployment
# Deploy to staging environment

# 8. User acceptance testing
# Have stakeholders test

# 9. Production deployment
# Only after all approvals
```

### Emergency Rollback Commands

If an update breaks the app:

```bash
# Immediate rollback
git checkout main
git reset --hard HEAD~1  # If last commit was the update

# Or rollback specific package
npm install package-name@previous-version

# Force exact version in package.json
# Change "^1.2.3" to "1.2.3"

# Clean reinstall
rm -rf node_modules package-lock.json
npm ci
```

### Monitoring Commands

Check for updates regularly:

```bash
# See outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# See what would be updated
npm update --dry-run

# Check specific package versions
npm list package-name
```

### Version History Log

| Date | Package | From | To | Notes | Rollback Required |
|------|---------|------|----|---------| ----------------- |
| 2024-01-01 | sonner | 1.x | 2.0.3 | Toast API stable | No |
| 2024-01-01 | react-hook-form | 7.x | 7.55.0 | Form validation works | No |

### Security Considerations

- Run `npm audit` weekly
- Subscribe to security advisories for critical packages
- Pin exact versions for security-sensitive packages
- Have rollback plan for emergency security updates

### Documentation Updates

When updating dependencies:

1. Update this VERSION_LOCK.md
2. Update package.json comments if needed
3. Update DEPLOYMENT_GUIDE.md if process changes
4. Test and update any code examples

---

**Last Updated**: 2024-01-01
**Next Review**: 2024-04-01