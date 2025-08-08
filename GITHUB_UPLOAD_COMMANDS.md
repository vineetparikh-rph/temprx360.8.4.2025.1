# 🚀 GitHub Upload Commands

After creating your GitHub repository, run these commands:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/georgies-pharmacy-admin.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Example:
If your GitHub username is "johnsmith", the command would be:
```bash
git remote add origin https://github.com/johnsmith/georgies-pharmacy-admin.git
git branch -M main
git push -u origin main
```

## 🔐 Authentication
If prompted for credentials:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (not your password)
  - Go to GitHub Settings > Developer settings > Personal access tokens
  - Generate a new token with "repo" permissions