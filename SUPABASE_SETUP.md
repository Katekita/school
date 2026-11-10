# Подключение Supabase

Сайт остаётся статическим на GitHub Pages. В клиент передаются только URL и publishable/anon key; `service_role` хранится исключительно в secrets Supabase Edge Functions.

## Настройка проекта

1. Создайте проект Supabase и настройте регион по требованиям школы/администрации к хранению персональных данных.
2. В Authentication отключите разрешение новых регистраций. Включите CAPTCHA (Cloudflare Turnstile или hCaptcha) и настройте лимиты входа в Authentication → Rate Limits.
3. Для ученических логинов используется зарезервированный недоставляемый домен `school68.invalid`: адреса нужны только как внутренний идентификатор Auth, почта на них не отправляется. Укажите это значение как `INTERNAL_LOGIN_DOMAIN` в Edge Function Secrets и `VITE_LOGIN_EMAIL_DOMAIN` в GitHub Actions variables. Восстановление пароля ученикам делает только руководство.
4. Заполните `.env` локально по `.env.example` значениями `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LOGIN_EMAIL_DOMAIN`. Эти клиентские значения попадут в JS bundle; секретный ключ сюда не добавлять.
5. Установите Supabase CLI, выполните `supabase login`, `supabase link --project-ref <project-ref>`, затем `supabase db push` и `supabase functions deploy change-password`, `supabase functions deploy admin-users`, `supabase functions deploy teacher-material-link`.
6. Supabase автоматически передаёт Edge Functions `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` и `SUPABASE_SECRET_KEYS`. Не создавайте для них вручную secrets с префиксом `SUPABASE_`. Добавьте только `INTERNAL_LOGIN_DOMAIN` и `PORTAL_ORIGIN` в Function Secrets; в `PORTAL_ORIGIN` укажите адрес GitHub Pages проекта.
7. Создайте первый профиль руководителя вручную через защищённый Supabase Dashboard: сначала создайте Auth пользователя, затем добавьте строку `profiles` с его UUID, `role='admin'`, `is_blocked=false`, `must_change_password=true`. Временный пароль передайте руководителю безопасным способом.
8. Добавьте GitHub Actions variables с `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_LOGIN_EMAIL_DOMAIN` и задайте их в шаге сборки workflow как `VITE_*` env. Запускайте публикацию только после ревью RLS.

Пока не подключены реальные credentials проекта, вход, вызовы функций и создание signed URL не заработают. Включение CAPTCHA требует также добавить компонент CAPTCHA в форму входа и передавать его token; это будет завершено при привязке реального проекта и ключа виджета.

## Секретность данных расписания

`src/data/schedule.js` содержит учебное расписание. Защита React-маршрута сама по себе не скрывает данные, если они остаются в JS bundle или истории Git. Перед включением закрытого расписания нужно перенести строки в `schedule_entries`, переключить все виджеты/поиск/экспорт `.ics` на защищённый запрос и удалить расписание из клиентских исходников. Оно уже попало в историю Git. Если администрация считает прежние коммиты раскрытием закрытых данных, согласуйте переписывание истории и force-push; иначе ограничьте доступ к репозиторию и считайте старую историю раскрытой.

## Ручная проверка после подключения

- Анонимный посетитель не читает `profiles`, расписание и материалы напрямую через REST API.
- Ученик видит только записи своего класса; учитель — разрешённое расписание и материалы; руководство — административные действия.
- Попытки прямого REST/Storage доступа с чужой ролью возвращают отказ RLS.
- Заблокированный аккаунт теряет доступ к данным и обновлению сессии.
- Временный пароль не виден повторно после ответа импорта; первая закрытая операция до смены пароля запрещена.
- Неверный пароль, CAPTCHA и предел частоты дают ожидаемые ошибки без раскрытия существования логина.
