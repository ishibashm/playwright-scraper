@echo off
setlocal EnableDelayedExpansion
echo ===================================
echo  Playwright Scraper Launcher
echo ===================================
echo.
cd /d "%~dp0"

:menu
cls
echo ===================================
echo  Playwright Scraper Launcher
echo ===================================
echo.
echo Select execution mode (type 'cancel' at any input to return here):
echo 1. New scrape (default settings from config.ts, prompts for details)
echo 2. New scrape (specify keyword, prompts for details)
echo 3. New scrape (specify keyword and max jobs, prompts for details)
echo 4. Resume from file (scrape details for items in specified file)
echo 5. Custom arguments (enter all arguments manually)
echo 6. Exit
echo.
set "CHOICE="
set /p "CHOICE=Enter your choice (1-6): "

set "FINAL_ARGS="
set "KEYWORD_PART="
set "USER_INPUT_KEYWORD="
set "USER_INPUT_MAX_JOBS="
set "USER_INPUT_PATH="
set "USER_INPUT_EXTRA_ARGS="

if /i "!CHOICE!"=="cancel" goto menu
if "!CHOICE!"=="6" goto end_launcher

if "!CHOICE!"=="1" (
    set "FINAL_ARGS="
    echo Running new scrape with default settings.
    goto run_script
)
if "!CHOICE!"=="2" (
    :keyword_input_mode2_retry
    set "USER_INPUT_KEYWORD="
    set /p "USER_INPUT_KEYWORD=Enter search keyword (or type 'cancel' to return to menu): "
    if /i "!USER_INPUT_KEYWORD!"=="cancel" goto menu
    if "!USER_INPUT_KEYWORD!"=="" (
        echo Keyword cannot be empty.
        goto keyword_input_mode2_retry
    )
    set "FINAL_ARGS=--keyword=\"!USER_INPUT_KEYWORD!\""
    echo Running new scrape with keyword: "!USER_INPUT_KEYWORD!".
    goto run_script
)
if "!CHOICE!"=="3" (
    :keyword_input_mode3_retry
    set "USER_INPUT_KEYWORD="
    set /p "USER_INPUT_KEYWORD=Enter search keyword (or type 'cancel' to return to menu): "
    if /i "!USER_INPUT_KEYWORD!"=="cancel" goto menu
    if "!USER_INPUT_KEYWORD!"=="" (
        echo Keyword cannot be empty.
        goto keyword_input_mode3_retry
    )
    set "KEYWORD_PART=--keyword=\"!USER_INPUT_KEYWORD!\""

    :max_jobs_input_mode3_retry
    set "USER_INPUT_MAX_JOBS="
    set /p "USER_INPUT_MAX_JOBS=Enter max number of jobs (or type 'cancel' to return to menu): "
    if /i "!USER_INPUT_MAX_JOBS!"=="cancel" goto menu
    if "!USER_INPUT_MAX_JOBS!"=="" (
        echo Max jobs cannot be empty.
        goto max_jobs_input_mode3_retry
    )
    set "FINAL_ARGS=!KEYWORD_PART! --max-jobs=!USER_INPUT_MAX_JOBS!"
    echo Running new scrape with keyword and max jobs.
    goto run_script
)
if "!CHOICE!"=="4" (
    :input_file_path_mode4_retry
    set "USER_INPUT_PATH="
    set /p "USER_INPUT_PATH=Enter path to input file (e.g., data/scraped-file.csv) (or type 'cancel' to return to menu): "
    if /i "!USER_INPUT_PATH!"=="cancel" goto menu
    if "!USER_INPUT_PATH!"=="" (
        echo Input file path cannot be empty.
        goto input_file_path_mode4_retry
    )
    set "FINAL_ARGS=--input-file=\"!USER_INPUT_PATH!\""

    echo.
    echo Optional: Add --max-jobs, --fetch-details, --no-fetch-details, --skip-chunk-confirm
    set "USER_INPUT_EXTRA_ARGS="
    set /p "USER_INPUT_EXTRA_ARGS=Enter additional arguments for resume mode (or 'cancel' to return to menu, leave blank if none): "
    if /i "!USER_INPUT_EXTRA_ARGS!"=="cancel" goto menu
    if not "!USER_INPUT_EXTRA_ARGS!"=="" (
        set "FINAL_ARGS=!FINAL_ARGS! !USER_INPUT_EXTRA_ARGS!"
    )
    echo Resuming from file.
    goto run_script
)
if "!CHOICE!"=="5" (
    :custom_args_mode5_retry
    echo.
    echo Enter all custom arguments (or type 'cancel' to return to menu).
    echo Examples: --keyword="Web開発" --max-jobs=10, --input-file=data/file.csv --fetch-details
    set "FINAL_ARGS="
    set /p "FINAL_ARGS=All arguments: "
    if /i "!FINAL_ARGS!"=="cancel" (
        set "FINAL_ARGS=" 
        goto menu
    )
    if "!FINAL_ARGS!"=="" (
        echo Custom arguments cannot be empty if this mode is chosen.
        goto custom_args_mode5_retry
    )
    goto run_script
)

echo Invalid choice. Please try again.
pause
goto menu

:run_script
if not defined FINAL_ARGS (
  echo No arguments were set. Running with script defaults.
  echo.
  echo Running: npm run scrape
  echo.
  npm run scrape
) else (
  echo.
  echo Running: npm run scrape -- !FINAL_ARGS!
  echo.
  npm run scrape -- !FINAL_ARGS!
)

echo.
echo ===================================
echo  Script finished.
echo ===================================
pause
goto menu

:end_launcher
echo Exiting launcher.
pause
endlocal
