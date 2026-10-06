@echo off
setlocal
cd /d "%~dp0"
echo ===== Prayer app APK builder =====

echo [1/7] Installing packages...
call npm install || goto :err
echo [2/7] Applying edition.config.json (name, location, icon)...
call node scripts\customize.cjs || goto :err
echo [3/7] Building the web app...
call npm run build || goto :err

echo [4/7] Creating the Android project...
if exist android rmdir /s /q android
call npx cap add android
if not exist android goto :err

echo [5/7] Adding notifications, permissions and icons...
call node scripts\android-setup.cjs || goto :err
call node scripts\make-android-icons.cjs || goto :err
call npx cap sync android || goto :err

set "SDK=%LOCALAPPDATA%\Android\Sdk"
if not exist "%SDK%" goto :nosdk
> android\local.properties echo sdk.dir=%SDK:\=/%
if exist "C:\Program Files\Android\Android Studio\jbr" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"

echo [6/7] Building the APK, this can take a few minutes...
pushd android
call gradlew.bat clean assembleDebug || goto :err
popd

copy /y android\app\build\outputs\apk\debug\app-debug.apk Prayer-App.apk >nul
echo.
echo ===== DONE =====
echo Your APK is here: %~dp0Prayer-App.apk
echo Uninstall the old app on your phone before installing a different edition.
pause
exit /b 0

:nosdk
echo.
echo Android SDK was not found at %SDK%
echo Install Android Studio, open it once to finish setup, then run this file again.
pause
exit /b 1

:err
echo.
echo Something failed. Scroll up to read the error and send it to Claude.
pause
exit /b 1
