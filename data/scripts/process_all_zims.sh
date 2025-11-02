#!/bin/bash

# Process all ZIM archives: ZIM -> JSON -> SQLite
# Place ZIM files in ../zim/ and run this script

set +e  # Don't exit on error, handle errors per-file

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ZIM_DIR="$SCRIPT_DIR/../zim"
JSON_DIR="$SCRIPT_DIR/../json"
SQLITE_DIR="$SCRIPT_DIR/../sqlite"

# Ensure output directories exist
mkdir -p "$JSON_DIR" "$SQLITE_DIR"

# Check if any .zim files exist
shopt -s nullglob
ZIM_FILES=("$ZIM_DIR"/*.zim)
shopt -u nullglob

if [ ${#ZIM_FILES[@]} -eq 0 ]; then
    echo "No .zim files found in $ZIM_DIR"
    exit 1
fi

echo "Found ${#ZIM_FILES[@]} ZIM archive(s) to process"
echo ""

for zim_file in "${ZIM_FILES[@]}"; do
    filename=$(basename "$zim_file" .zim)
    json_file="$JSON_DIR/${filename}.json"
    sqlite_file="$SQLITE_DIR/${filename}.db"
    
    echo "================================================"
    echo "Processing: $filename"
    echo "================================================"
    
    # Check if ZIM file is valid (not empty)
    if [ ! -s "$zim_file" ]; then
        echo "⚠ WARNING: ZIM file is empty or invalid, skipping: $zim_file"
        echo ""
        continue
    fi
    
    # Step 1: ZIM -> JSON
    if [ -f "$json_file" ]; then
        echo "JSON already exists: $json_file (skipping)"
    else
        echo "Step 1: Creating JSON from ZIM..."
        if ! "$SCRIPT_DIR/zim_to_json.py" "$zim_file" --output "$json_file"; then
            echo "⚠ ERROR: Failed to create JSON from ZIM, skipping this archive"
            echo ""
            continue
        fi
    fi
    
    # Step 2: JSON -> SQLite
    if [ -f "$sqlite_file" ]; then
        echo "SQLite database already exists: $sqlite_file (skipping)"
    else
        echo "Step 2: Creating SQLite database from JSON..."
        if ! "$SCRIPT_DIR/json_to_sql.py" "$json_file" --database "$sqlite_file"; then
            echo "⚠ ERROR: Failed to create SQLite database, skipping this archive"
            echo ""
            continue
        fi
    fi
    
    echo "✓ Completed: $filename"
    echo ""
done

echo "================================================"
echo "All archives processed successfully!"
echo "JSON files: $JSON_DIR"
echo "SQLite databases: $SQLITE_DIR"
echo "================================================"
