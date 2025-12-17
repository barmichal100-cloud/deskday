@echo off
echo Stopping all Node processes...
taskkill /F /IM node.exe

echo.
echo Generating Prisma client...
call npx prisma generate

echo.
echo Starting dev server...
call npm run dev
