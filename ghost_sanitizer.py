import os

def scan_secrets():
    search_dirs = [
        'packages/pieces/community/google-sheets',
        'packages/pieces/community/webflow'
    ]
    # Patterns to look for
    secret_patterns = ['ghp_', 'apikey', 'Authorization: Bearer', 'Bearer ']
    
    found_any = False
    for root_dir in search_dirs:
        for root, dirs, files in os.walk(root_dir):
            for file in files:
                if file.endswith(('.ts', '.js', '.json', '.md')):
                    path = os.path.join(root, file)
                    try:
                        # Try different encodings
                        for enc in ['utf-8', 'utf-16', 'utf-8-sig']:
                            try:
                                with open(path, encoding=enc) as f:
                                    content = f.read()
                                    break
                            except:
                                continue
                        
                        for pattern in secret_patterns:
                            if pattern in content:
                                # Check if it's a hardcoded value vs a variable
                                # Simple check: is it followed by a long string in quotes?
                                print(f"POTENTIAL SECRET in {path}: Found pattern '{pattern}'")
                                found_any = True
                    except Exception as e:
                        print(f"Error reading {path}: {e}")
    
    if not found_any:
        print("No hardcoded secrets found in the source code of the pieces.")

if __name__ == "__main__":
    scan_secrets()
