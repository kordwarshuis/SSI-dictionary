#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

export GENERATED_JSON_GLOSSARIES_DIR="${GENERATED_JSON_GLOSSARIES_DIR:-$ROOT/public/data/glossaries}"
export GENERATED_JSON_DICTIONARY_DIR="${GENERATED_JSON_DICTIONARY_DIR:-$ROOT/public/data}"

mkdir -p "$GENERATED_JSON_GLOSSARIES_DIR"
mkdir -p "$GENERATED_JSON_DICTIONARY_DIR"
mkdir -p "$ROOT/fetchExternalContent/fetchExternalGlossaries/fetchNistContent/download"
mkdir -p "$ROOT/static/json"

echo "Using GENERATED_JSON_GLOSSARIES_DIR=$GENERATED_JSON_GLOSSARIES_DIR"

# node fetchExternalContent/fetchExternalGlossaries/fetchDigitalGovtNzContent/fetchDigitalGovtNzContent.mjs

# node fetchExternalContent/fetchExternalGlossaries/fetchNistContent/fetchNistContent.mjs

# node fetchExternalContent/fetchExternalGlossaries/fetchToipDidWebs/fetchToipDidWebs.mjs

# node fetchExternalContent/fetchExternalGlossaries/fetchWotTermsContent/fetchWotTermsContent.mjs

node fetchExternalContent/fetchExternalGlossaries/fetchSpecUpT/fetchSpecUpT.mjs

# # Combine glossaries
node fetchExternalContent/fetchExternalGlossaries/createDictionary.mjs