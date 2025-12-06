# Mediar Piece

This piece adds security-automation utilities for Mediar, including a Bitdefender exception manager that allows workflows to automatically register file paths or directories as exclusions.

## 🧩 Actions

### ➕ Add to Bitdefender Exceptions
Adds a file or folder path to the Bitdefender exclusion list.

| Property | Type | Description |
|----------|------|-------------|
| `path`   | Short Text (required) | File or directory path to add to the exception list. |

## 🚀 Example Use Cases
- Automatically exclude quarantined files for development workflows.
- Safelist dynamically generated application folders.
- Prevent antivirus interference during CI/CD automation.

## 📦 Version
Minimum Activepieces release: **0.9.0**

## 👤 Author
- **lau90eth**
