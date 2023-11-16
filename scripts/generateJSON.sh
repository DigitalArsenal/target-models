#!/bin/bash

# Navigate to the schema directory
cd "./schema" || exit

# Loop through all subdirectories in the schema directory
for dir in */; do
    # Change to the directory
    cd "$dir"
    # Find all .fbs files in the directory
    for fbs in *.fbs; do
        # Check if .fbs files exist and are not empty
        if [ -s "$fbs" ]; then
            # Run flatc to generate JSON schema
            flatc --jsonschema -o . "$fbs"
            echo "Generated JSON schema for $fbs"
        else
            echo "No FlatBuffers schema files found in $dir"
        fi
    done
    # Go back to the schema directory before the next iteration
    cd ..
done

# Go back to the original directory
cd ..
