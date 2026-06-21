"""
Load all generated paper JSON files into the database as tests.

Usage:
    python load_all_tests.py

Edit GENERATED_PAPERS_DIR below to point at your generated_papers folder
(the one with the 25-Reasoning-question JSON files from the generation
pipeline).
"""

import os
import glob
from database import init_db, load_test_from_json

# Point this at your generated_papers folder (relative or absolute path)
GENERATED_PAPERS_DIR = "../../generated_papers"


def load_all():
    init_db()

    json_files = sorted(glob.glob(os.path.join(GENERATED_PAPERS_DIR, "*.json")))
    # Skip blueprint files - we only want the actual question papers
    json_files = [f for f in json_files if "_blueprint" not in f]

    if not json_files:
        print(f"No JSON files found in {GENERATED_PAPERS_DIR}")
        print("Edit GENERATED_PAPERS_DIR in this script to point at the right folder.")
        return

    for path in json_files:
        test_name = os.path.splitext(os.path.basename(path))[0].replace("_", " ").title()
        load_test_from_json(path, test_name)

    print(f"\nLoaded {len(json_files)} test(s) into the database.")


if __name__ == "__main__":
    load_all()
