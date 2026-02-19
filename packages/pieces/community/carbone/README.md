# Carbone

[Carbone](https://carbone.io/) is a fast, simple and powerful report generator.  
Generate PDF, DOCX, XLSX, ODT, PPTX, ODS, CSV and more from a template and your JSON data.

## Authentication

You need a **Carbone API Key** to use this integration.  
Get one at [carbone.io](https://account.carbone.io/) (free tier available).

## Actions

| Action | Description |
|--------|-------------|
| **Render Document** | Render a stored template with JSON data and return the generated file as a base64-encoded string |
| **Upload Template** | Upload a template file (DOCX, XLSX, ODS, ODT, PPTX, etc.) to Carbone and receive a template ID |
| **Delete Template** | Delete a previously uploaded template by its ID |

## How it works

1. **Upload a template** — Upload a DOCX/XLSX/ODS file with `{d.variableName}` placeholders
2. **Render** — Pass JSON data; Carbone substitutes the placeholders and generates your document
3. **Use the output** — The rendered file is returned as base64; decode it to get the binary file

## Links

- [Carbone Documentation](https://carbone.io/documentation.html)
- [Carbone Cloud API Reference](https://carbone.io/api-reference.html)
- [Template Syntax](https://carbone.io/documentation.html#substitutions)
