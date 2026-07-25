#!/usr/bin/env bash
# Run Assumptions skill evals against fixtures and tests.
# Usage: ./scripts/run-evals.sh [--verbose]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FIXTURES_DIR="$REPO_ROOT/fixtures"
TESTS_DIR="$REPO_ROOT/tests"
EVALS_DIR="$REPO_ROOT/evals"
RESULTS_DIR="$EVALS_DIR/results"

VERBOSE=false
[[ "${1:-}" == "--verbose" ]] && VERBOSE=true

mkdir -p "$RESULTS_DIR"

echo "=== Assumptions Eval Runner ==="
echo "Fixtures: $FIXTURES_DIR"
echo "Tests: $TESTS_DIR"
echo

# ponytail: no framework, just iterate dirs and record pass/fail counts
# Upgrade: add grading logic per rubric.md

fixture_count=0
test_count=0

for fixture_dir in "$FIXTURES_DIR"/*; do
    [[ -d "$fixture_dir" ]] || continue
    fixture_name=$(basename "$fixture_dir")
    expected_file="$fixture_dir/EXPECTED_FINDINGS.md"
    
    if [[ ! -f "$expected_file" ]]; then
        echo "⚠️  $fixture_name: no EXPECTED_FINDINGS.md"
        continue
    fi
    
    ((fixture_count++))
    echo "📋 Fixture: $fixture_name"
    
    if $VERBOSE; then
        echo "   Expected file: $expected_file"
        inputs=$(find "$fixture_dir" -maxdepth 1 \( -name "*.ts" -o -name "*.sql" \) -exec basename {} \; | tr '\n' ' ')
        echo "   Input files: ${inputs:-none}"
    fi
done

echo
for test_dir in "$TESTS_DIR"/*; do
    [[ -d "$test_dir" ]] || continue
    test_name=$(basename "$test_dir")
    expected_file="$test_dir/test-notes/EXPECTED.md"
    
    if [[ ! -f "$expected_file" ]]; then
        echo "⚠️  $test_name: no test-notes/EXPECTED.md"
        continue
    fi
    
    ((test_count++))
    echo "🧪 Test: $test_name"
    
    if $VERBOSE; then
        echo "   Expected file: $expected_file"
    fi
done

echo
echo "Summary: $fixture_count fixtures, $test_count tests found"
echo "Results would be written to: $RESULTS_DIR/"
echo
echo "⚠️  Manual skill invocation required — this script inventories only."
echo "    To run evals: invoke skill on each fixture input, compare to EXPECTED_FINDINGS.md per rubric.md"
