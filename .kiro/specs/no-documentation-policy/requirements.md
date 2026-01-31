# No Documentation Policy

## Overview
This spec establishes a strict policy: NO documentation or reports should be created during development.

## Requirements

### 1. No Documentation Files
- NEVER create README.md
- NEVER create CONTRIBUTING.md
- NEVER create SECURITY.md
- NEVER create CHANGELOG.md
- NEVER create any .md files except code comments
- NEVER create deployment guides
- NEVER create user guides

### 2. No Reports
- NEVER create test reports
- NEVER create audit reports
- NEVER create summary files
- NEVER create analysis documents

### 3. No GitHub Templates
- NEVER create .github folder
- NEVER create issue templates
- NEVER create PR templates
- NEVER create workflows

### 4. Code Only
- Focus on code implementation
- Use inline comments for explanations
- Keep code self-documenting
- Use descriptive variable/function names

### 5. Exceptions
- .env.example is allowed (configuration template)
- .gitignore is allowed (git configuration)
- package.json is allowed (project configuration)
- tsconfig.json is allowed (TypeScript configuration)
- LICENSE is allowed (legal requirement)

## Acceptance Criteria

1. No .md files exist except in .kiro/specs
2. No .github directory exists
3. No documentation folders exist
4. Code is clean and self-explanatory
5. Only essential configuration files present
