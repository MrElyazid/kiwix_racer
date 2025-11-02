@echo off
REM Process all ZIM archives: ZIM -> JSON -> SQLite
REM Place ZIM files in ..\zim\ and run this script

setlocal enabledelayedexpansion

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "ZIM_DIR=%SCRIPT_DIR%..\zim"
set "JSON_DIR=%SCRIPT_DIR%..\json"
set "SQLITE_DIR=%SCRIPT_DIR%..\sqlite"

REM Ensure output directories exist
if not exist "%JSON_DIR%" mkdir "%JSON_DIR%"
if not exist "%SQLITE_DIR%" mkdir "%SQLITE_DIR%"

REM Check if any .zim files exist
set "ZIM_COUNT=0"
for %%f in ("%ZIM_DIR%\*.zim") do (
    set /a ZIM_COUNT+=1
)

if %ZIM_COUNT%==0 (
    echo No .zim files found in %ZIM_DIR%
    exit /b 1
)

echo Found %ZIM_COUNT% ZIM archive^(s^) to process
echo.

REM Process each ZIM file
for %%f in ("%ZIM_DIR%\*.zim") do (
    set "ZIM_FILE=%%f"
    set "FILENAME=%%~nf"
    set "JSON_FILE=%JSON_DIR%\!FILENAME!.json"
    set "SQLITE_FILE=%SQLITE_DIR%\!FILENAME!.db"
    
    echo ================================================
    echo Processing: !FILENAME!
    echo ================================================
    
    REM Check if ZIM file is valid (not empty)
    if %%~zf==0 (
        echo WARNING: ZIM file is empty or invalid, skipping: %%f
        echo.
        goto :continue
    )
    
    REM Step 1: ZIM -> JSON
    if exist "!JSON_FILE!" (
        echo JSON already exists: !JSON_FILE! ^(skipping^)
    ) else (
        echo Step 1: Creating JSON from ZIM...
        python "%SCRIPT_DIR%zim_to_json.py" "%%f" --output "!JSON_FILE!"
        if errorlevel 1 (
            echo WARNING: Failed to create JSON from ZIM, skipping this archive
            echo.
            goto :continue
        )
    )
    
    REM Step 2: JSON -> SQLite
    if exist "!SQLITE_FILE!" (
        echo SQLite database already exists: !SQLITE_FILE! ^(skipping^)
    ) else (
        echo Step 2: Creating SQLite database from JSON...
        python "%SCRIPT_DIR%json_to_sql.py" "!JSON_FILE!" --database "!SQLITE_FILE!"
        if errorlevel 1 (
            echo WARNING: Failed to create SQLite database, skipping this archive
            echo.
            goto :continue
        )
    )
    
    echo Completed: !FILENAME!
    echo.
    
    :continue
)

echo ================================================
echo All archives processed successfully!
echo JSON files: %JSON_DIR%
echo SQLite databases: %SQLITE_DIR%
echo ================================================

endlocal
