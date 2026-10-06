# Getting the APK (no commands needed)

1. In GitHub, open your repository's `main` branch.
2. Upload ALL files of this project to it (including the hidden `.github` folder). Commit.
3. Add the signing key as a secret (one time only): repo **Settings → Secrets and variables → Actions → New repository secret**. Name: `DEBUG_KEYSTORE_BASE64`. Value: the full text from `DEBUG_KEYSTORE_BASE64.txt` (kept outside the project, never commit it).
4. Open the **Actions** tab. The build starts by itself (about 5 to 8 minutes). Wait for the green tick.
5. Open **Releases** and download the newest `.apk` named after the person.
6. Install it on the phone. On first launch tap **Allow and continue**.

To change the name, location, colours or icon, edit **edition.config.json** and commit. See **CUSTOMIZE.md**.

Every build is signed with the same key (stored in the `DEBUG_KEYSTORE_BASE64` GitHub secret, not in the code), so a new APK installs over the old one and keeps data. A different name makes a different app id, so it installs next to the old one.

## Local build (optional, Windows)
Double-click `build-apk.bat`. Needs Node 20 and Android Studio (opened once).
