# No Documentation Policy - Design

## Implementation

### File System Rules
1. Block creation of documentation files
2. Delete any documentation if created
3. Maintain only code and configuration

### Allowed Files
- Source code (.ts, .tsx, .js, .jsx, .sol)
- Configuration (.json, .env.example, .gitignore)
- LICENSE (legal requirement)

### Forbidden Files
- Any .md files in root or subdirectories (except .kiro/specs)
- .github directory and contents
- docs/ directory
- Any report files

## Enforcement
- Manual review before commits
- Focus on code quality over documentation
- Self-documenting code practices
