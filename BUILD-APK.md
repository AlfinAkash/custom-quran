# Getting the APK (no commands needed)

1. In GitHub, make a branch called `zeenath` and open it.
2. Upload ALL files of this project to it (including the hidden `.github` folder and the `signing` folder). Commit.
3. Open the **Actions** tab. The build starts by itself (about 5 to 8 minutes). Wait for the green tick.
4. Open **Releases** and download the newest `.apk` named after the person.
5. Install it on the phone. On first launch tap **Allow and continue**.

To change the name, location, colours or icon, edit **edition.config.json** and commit. See **CUSTOMIZE.md**.

Every build is signed with the same key (`signing/debug.keystore`), so a new APK installs over the old one and keeps data. A different name makes a different app id, so it installs next to the old one.

## Local build (optional, Windows)
Double-click `build-apk.bat`. Needs Node 20 and Android Studio (opened once).
