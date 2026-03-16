# tree-sitter-blade Progress

## Current Goal
Integrate full PHP grammar into Blade template parser for better AST generation.

## Problem Identified
1. **Simple directives** (`@class`, `@if`): Parser outputs raw text but tests expect `(parameter (expression ...))`
2. **`@can` directive**: Fails to parse comma-separated arguments like `@can('update', $post)` - gets ERROR nodes

## Root Cause
The grammar uses raw text matching for parameters (`choice(/[^()]+/, $._nested_parenthases)`), which doesn't parse PHP at all - it just matches text.

## Previous Work Attempted
Added full PHP grammar (~1000 lines) to properly parse PHP expressions, but encountered issues:
- Grammar bundles and generates
- Tests have updated expectations to match parsed AST
- BUT: The PHP grammar has a bug in `variable_name` rule:
  - Uses `reserved('nothing', $.name)` which only matches literal `$nothing`
  - Should match any PHP variable like `$post`, `$user`, etc.

## Current State
- Grammar reverted to original (raw text matching)
- Test files have updated expectations
- Need to fix the PHP grammar variable_name issue

## Fix Required
In the bundled grammar (or source), change `variable_name` from:
```typescript
variable_name: $ => seq('$', reserved('nothing', $.name)),
```
To something that matches any valid PHP variable name:
```typescript
variable_name: $ => seq('$', alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.name)),
```

## Next Steps
1. Re-apply the PHP grammar changes (the large grammar.ts additions)
2. Fix the variable_name rule
3. Run `tree-sitter generate` 
4. Run `tree-sitter test` to verify

## Relevant Files
- `main/grammar.ts` - Grammar source (need to add PHP grammar back)
- `grammar.js` - Bundled grammar
- `test/corpus/*.txt` - Test expectations (already updated)
