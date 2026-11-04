#!/usr/bin/env bash
# Compile and run this question's tests with a small stack, like the grader.
set -e
cd "$(dirname "$0")"
mkdir -p _build
cp assert.ml tree.ml _build/
cd _build
ocamlc -w -a -o test.byte assert.ml tree.ml
OCAMLRUNPARAM='l=2000' ./test.byte
