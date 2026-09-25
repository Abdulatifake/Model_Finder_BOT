# Деплой Model Finder

| Часть | Где | Адрес | Статус |
|---|---|---|---|
| Mini App | Vercel | https://model-finder-app.vercel.app | ✅ задеплоено |
| Админ-панель | Vercel | https://model-finder-admin.vercel.app | ✅ задеплоено |
| Backend: API + Telegram-бот + AI | Render | https://model-finder-uz-api.onrender.com | ⏳ по шагам ниже |
| База данных | Neon | — | ✅ работает |

Всё, что нужно Render, уже лежит в репозитории: [`render.yaml`](render.yaml) (Blueprint). Остаётся создать аккаунт, вписать 4 секрета и нажать Deploy.

## Сколько стоит Render

| | Цена |
|---|---|
| Workspace Hobby | $0 |
| Сервер `1c-2g` (1 CPU, 2 GB RAM) | $25 / мес |
| Диск 5 GB | $1.25 / мес ($0.25 за GB) |
| Трафик | 5 GB / мес включено, дальше $0.15 за GB |
| **Итого** | **≈ $26.25 / мес**, оплата посекундная |

Почему не бесплатный тариф и не Starter ($7): три AI-модели (поиск по фото, по тексту и распознавание предметов) вместе занимают ~1.1 GB памяти — это измерено. У Free и Starter всего 512 MB, сервер будет падать с «Out of memory». Кроме того, Free засыпает через 15 минут без запросов и не поддерживает постоянный диск.

## Шаг 0. Подготовка

- Откройте файл `D:\models\backend\.env` — из него вы скопируете 4 значения: `BOT_TOKEN`, `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`. Копируйте только то, что после `=`, без пробелов и кавычек.
- Нужна банковская карта (Visa/Mastercard): Render списывает $1 для проверки и сразу возвращает.

## Шаг 1. Аккаунт на Render

1. Откройте https://dashboard.render.com/register → **GitHub** → войдите как `Abdulatifake` → **Authorize Render**.
2. Если спросит тип workspace — выберите **Hobby**.

## Шаг 2. Создать сервис из Blueprint

1. В Dashboard нажмите **New → Blueprint**.
2. Render покажет список репозиториев. Если `Model_Finder_BOT` в нём нет — нажмите **Configure account** и в GitHub выберите **Only select repositories → Model_Finder_BOT → Save**.
3. Напротив `Abdulatifake/Model_Finder_BOT` нажмите **Connect**.
4. Заполните **Blueprint Name**: `model-finder`, **Branch**: `main`.
5. Render прочитает `render.yaml` и покажет, что создаст: web-сервис **model-finder-uz-api** (регион Ohio, тариф `1c-2g`) с диском **data** на 5 GB.
6. Впишите секреты — Render спрашивает их только сейчас, при создании:

   | Ключ | Откуда взять |
   |---|---|
   | `BOT_TOKEN` | `backend/.env` → `BOT_TOKEN` |
   | `DATABASE_URL` | `backend/.env` → `DATABASE_URL` (адрес с `-pooler`) |
   | `DIRECT_URL` | `backend/.env` → `DIRECT_URL` (адрес без `-pooler`) |
   | `ADMIN_PASSWORD` | `backend/.env` → `ADMIN_PASSWORD` — **обязательно тот же**, иначе скрипт загрузки картинок (шаг 5) не сможет войти |

   Остальное заполнится само: `ADMIN_TOKEN_SECRET` Render сгенерирует, а `DATA_DIR`, `CHANNEL_USERNAME`, `MINI_APP_URL`, `ALLOWED_ORIGINS` уже прописаны в `render.yaml`.
7. Нажмите **Deploy Blueprint**. Если Render попросит карту — добавьте её и повторите.

## Шаг 3. Первый запуск (5–10 минут)

Откройте сервис **model-finder-uz-api** → вкладка **Logs**.

1. Сборка: `npm ci` → `prisma generate` → `prisma migrate deploy` → строка `No pending migrations to apply.` (база уже готова — так и должно быть).
2. Запуск. Должны появиться строки:

   ```
   🌐 API: http://localhost:10000
   🤖 Telegram bot webhook rejimida: https://model-finder-uz-api.onrender.com/telegram/webhook
   🧠 AI modellar tayyor (…s)
   ```

   При первом запуске сервер скачивает AI-модели (~370 MB) с Hugging Face на диск, поэтому `AI modellar tayyor` появится через 1–3 минуты. При следующих перезапусках — за секунды.
3. Статус сервиса станет **Live**.

С этого момента бот работает на Render. Если на компьютере запущен `START-BOT.bat`, локальный бот сам остановится с сообщением `❌ Bot boshqa joyda allaqachon ishlab turibdi` — это нормально: Telegram теперь отправляет сообщения на сервер.

## Шаг 4. Проверка

1. Откройте https://model-finder-uz-api.onrender.com/health → должно быть `{"ok":true}`.
   Если адрес сервиса в Render другой (например, `model-finder-uz-api-abcd.onrender.com`) — см. «Проблемы → Render дал другой адрес».
2. В Telegram отправьте боту `/start` → бот отвечает, кнопка **🔍 Model Finder** открывает https://model-finder-app.vercel.app.

## Шаг 5. Загрузить превью-картинки (сразу после Live)

Диск на Render пустой, поэтому у моделей пока нет картинок: в Mini App их не видно, а карточки в боте могут выдавать ошибку. 119 070 картинок (~3.1 GB) загружаются с компьютера двумя командами в PowerShell:

```
cd D:\models\backend
npm run upload-thumbnails -- https://model-finder-uz-api.onrender.com
```

- Прогресс выглядит так: `12000 / 119070 (10.1%) · qoldi ≈ 25 daq`, в конце — `✅ Tugadi!`.
- Время зависит от скорости отдачи интернета: 50 Мбит/с ≈ 10 минут, 10 Мбит/с ≈ 45 минут.
- Если оборвалось — запустите ту же команду ещё раз: уже загруженные файлы пропускаются.

## Шаг 6. Админ-панель

https://model-finder-admin.vercel.app → пароль = `ADMIN_PASSWORD`. Вход действует 7 дней, **↩ Chiqish** — выход.

## Как работать после переезда

- **Компьютер.** `START-BOT.bat` для бота больше не нужен. Если его запустить, он напишет `Bot serverda ishlayapti — lokal bot ishga tushirilmadi` и поднимет только локальный API и админку: бота на сервере он не перехватит и кнопку Mini App не поменяет.
- **Отладка на компьютере.** `BOT_MODE=polling` в `backend/.env` принудительно забирает бота на компьютер. Сервер после этого сообщений не получает, пока его не перезапустить: Render → сервис → **Manual Deploy → Restart service**.
- **Канал.** Новые посты в @PROMODELS2028 сервер добавляет сам — бот должен оставаться админом канала.
- **Обновление backend.** `git push` в `main` → Render сам пересобирает сервис (~5 минут). Из-за диска перезапуск идёт с паузой ~1 минута; Telegram за это время сообщения не теряет, а доставит повторно.
- **Обновление Mini App и админки.** В папке `D:\models\mini-app` (или `D:\models\admin-panel`) выполните `npx vercel deploy --prod`. Чтобы Vercel обновлял их сам при `git push`: проект на Vercel → **Settings → Git → Connect Git Repository** → `Model_Finder_BOT`, и в настройках проекта поле **Root Directory** = `mini-app` (для `model-finder-app`) или `admin-panel` (для `model-finder-admin`).

## Проблемы

| Симптом | Что делать |
|---|---|
| Сборка падает на `prisma migrate deploy` (`P1001`, `P1000`) | Неверный `DATABASE_URL` или `DIRECT_URL`. Сервис → **Environment** → исправить → **Manual Deploy → Deploy latest commit** |
| В логах `Out of memory` / `Ran out of memory` | **Settings → Instance Type** должен быть `1c-2g` (2 GB) |
| Бот молчит | В логах должна быть строка `webhook rejimida`. Откройте в браузере `https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo`: `url` должен быть `https://model-finder-uz-api.onrender.com/telegram/webhook`, а `last_error_message` покажет причину. Проверьте, что на компьютере не запущен бот с `BOT_MODE=polling` |
| Mini App или админка: «Failed to fetch» | 1) Сервис не Live — проверьте `/health`. 2) CORS: `ALLOWED_ORIGINS` должен быть ровно `https://model-finder-app.vercel.app,https://model-finder-admin.vercel.app` (без `/` в конце) |
| Админка: «Parol noto'g'ri» | Пароль не совпадает с `ADMIN_PASSWORD` в **Environment** на Render |
| Нет картинок | Шаг 5 не выполнен или прервался — запустите команду ещё раз |
| Render дал другой адрес | Vercel → оба проекта → **Settings → Environment Variables** → `VITE_API_URL` = новый адрес → **Deployments → ⋯ → Redeploy**. Скрипт картинок запускайте с новым адресом |

После изменения переменных в **Environment** Render перезапускает сервис (если спросит — выберите вариант с deploy).

## Важно

- Секреты (`BOT_TOKEN`, пароль базы, `ADMIN_PASSWORD`) хранятся только в `backend/.env` и в Render → **Environment**. В git их не добавляйте.
- Бесплатный Vercel Hobby разрешён только для некоммерческого использования. Если бот станет платным, нужен Vercel Pro ($20 / мес) — или перенесите Mini App и админку на бесплатные Render Static Sites.
