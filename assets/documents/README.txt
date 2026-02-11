Бланки заявлений на возврат страховки (DOCX)
============================================

Чтобы скачивание бланков на сайте работало, в этой папке должны лежать
файлы с точными именами (латиница). Сайт отдаёт «Файл недоступен», если
файлов нет.

БЫСТРЫЙ СПОСОБ (если в корне проекта уже есть .docx с кириллическими именами):
  В корне проекта выполните:
    npm run copy-docx
  Скрипт скопирует Сбербанк.docx, почтабанк страховка.docx и др. в эту папку
  с именами zajavlenie-sberbank.docx, zajavlenie-pochta-bank.docx и т.д.
  Затем закоммитьте папку assets/documents/ (вместе с .docx) и задеплойте сайт.

Требуемые имена файлов в этой папке:
- zajavlenie-sberbank.docx
- zajavlenie-pochta-bank.docx
- zajavlenie-sovkombank.docx
- zajavlenie-tinkoff.docx
- zajavlenie-universal.docx   (универсальный бланк для ВТБ, Альфа-Банк, РСХБ, Газпромбанк)

Опционально: zajavlenie-vtb.docx, zajavlenie-alfa-bank.docx, zajavlenie-rshb.docx, zajavlenie-gazprombank.docx
